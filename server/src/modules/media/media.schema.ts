import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination.js";

/**
 * Upload folders (portfolio.md §7.2). Signed uploads can only target these, so a leaked
 * signature can't write elsewhere in the Cloudinary account.
 */
export const MEDIA_FOLDER_PATTERN =
  /^portfolio\/(general|brand|about|companies|certificates|resumes|blog|case-studies|projects(\/[a-z0-9]+(?:-[a-z0-9]+)*)?)$/;

export const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp", "gif", "avif", "pdf"] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // Cloudinary free plan limit

const folder = z.string().regex(MEDIA_FOLDER_PATTERN, "Folder not allowed");

export const signatureSchema = z.object({ folder });

export const createMediaSchema = z.object({
  publicId: z.string().min(1).max(300),
  resourceType: z.enum(["image", "raw"]).default("image"),
  folder,
  alt: z.string().trim().min(1, "Alt text is required").max(300),
  originalFilename: z.string().trim().max(200).default(""),
});

export const updateMediaSchema = z.object({
  alt: z.string().trim().min(1, "Alt text is required").max(300),
});

export const listMediaQuerySchema = paginationQuerySchema.extend({
  folder: z.string().max(100).optional(),
  kind: z.enum(["image", "pdf"]).optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(40),
});
