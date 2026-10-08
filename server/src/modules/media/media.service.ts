import type { Types } from "mongoose";
import mongoose from "mongoose";
import { cloudinary, cloudinaryConfig } from "../../config/cloudinary.js";
import { logger } from "../../lib/logger.js";
import { AppError, badRequest, notFound } from "../../utils/app-error.js";
import { escapeRegex } from "../../utils/regex.js";
import { paginationMeta, toSkip } from "../../utils/pagination.js";
import { Media } from "./media.model.js";
import { ALLOWED_FORMATS, MAX_UPLOAD_BYTES } from "./media.schema.js";
import type { z } from "zod";
import type { createMediaSchema, listMediaQuerySchema } from "./media.schema.js";

const ALLOWED_FORMATS_PARAM = ALLOWED_FORMATS.join(",");

/** Signs a direct browser → Cloudinary upload restricted to one folder and safe formats. */
export function createUploadSignature(folder: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = { allowed_formats: ALLOWED_FORMATS_PARAM, folder, timestamp };
  const signature = cloudinary.utils.api_sign_request(params, cloudinaryConfig.apiSecret);
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`,
    apiKey: cloudinaryConfig.apiKey,
    cloudName: cloudinaryConfig.cloudName,
    timestamp,
    signature,
    folder,
    allowedFormats: ALLOWED_FORMATS_PARAM,
  };
}

type CloudinaryResource = {
  public_id: string;
  secure_url: string;
  resource_type: "image" | "raw" | "video";
  format?: string;
  bytes: number;
  width?: number;
  height?: number;
  folder?: string;
  asset_folder?: string;
};

/**
 * Registers an upload in the library. Details come from Cloudinary's Admin API, never from
 * the client, so size/format/folder limits can't be bypassed.
 */
export async function registerUpload(
  input: z.infer<typeof createMediaSchema>,
  adminId: Types.ObjectId,
) {
  const existing = await Media.findOne({ publicId: input.publicId });
  if (existing) return existing;

  let resource: CloudinaryResource;
  try {
    resource = (await cloudinary.api.resource(input.publicId, {
      resource_type: input.resourceType,
    })) as CloudinaryResource;
  } catch (err) {
    logger.warn({ err, publicId: input.publicId }, "Cloudinary resource lookup failed");
    throw badRequest("Upload not found on Cloudinary");
  }

  const folder = resource.asset_folder ?? resource.folder ?? "";
  const inFolder = folder === input.folder || resource.public_id.startsWith(`${input.folder}/`);
  const formatOk =
    !!resource.format && (ALLOWED_FORMATS as readonly string[]).includes(resource.format);
  if (!inFolder || !formatOk || resource.bytes > MAX_UPLOAD_BYTES) {
    await destroyAsset(resource.public_id, resource.resource_type === "raw" ? "raw" : "image");
    throw badRequest(
      !inFolder
        ? "Upload is outside the expected folder"
        : !formatOk
          ? "File type not allowed"
          : "File is larger than 10 MB",
    );
  }

  return Media.create({
    publicId: resource.public_id,
    url: resource.secure_url,
    resourceType: resource.resource_type === "raw" ? "raw" : "image",
    format: resource.format,
    folder: input.folder,
    bytes: resource.bytes,
    width: resource.width,
    height: resource.height,
    alt: input.alt,
    originalFilename: input.originalFilename,
    createdBy: adminId,
  });
}

export async function listMedia(query: z.infer<typeof listMediaQuerySchema>) {
  const filter: Record<string, unknown> = {};
  if (query.folder) filter.folder = query.folder;
  if (query.kind === "pdf") filter.format = "pdf";
  if (query.kind === "image") filter.format = mongoose.trusted({ $ne: "pdf" });
  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), "i");
    filter.$or = mongoose.trusted([{ alt: pattern }, { originalFilename: pattern }]);
  }
  const [items, total] = await Promise.all([
    Media.find(filter).sort({ createdAt: -1 }).skip(toSkip(query)).limit(query.limit).lean(),
    Media.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, query) };
}

export const listFolders = () => Media.distinct("folder");

export async function updateAlt(id: string, alt: string) {
  const media = await Media.findByIdAndUpdate(id, { alt }, { new: true });
  if (!media) throw notFound("Media not found");
  return media;
}

async function destroyAsset(publicId: string, resourceType: "image" | "raw") {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
  } catch (err) {
    logger.error({ err, publicId }, "Cloudinary destroy failed");
  }
}

export async function deleteMedia(id: string) {
  const media = await Media.findById(id);
  if (!media) throw notFound("Media not found");
  if (media.usedIn.length > 0) {
    throw new AppError(409, "MEDIA_IN_USE", "This file is still used and can't be deleted", {
      usedIn: media.usedIn.map(({ resource, documentId, label }) => ({
        resource,
        documentId,
        label,
      })),
    });
  }
  await destroyAsset(media.publicId, media.resourceType === "raw" ? "raw" : "image");
  await media.deleteOne();
  return media;
}
