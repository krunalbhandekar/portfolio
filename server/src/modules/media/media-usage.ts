import mongoose, { Types } from "mongoose";
import { badRequest } from "../../utils/app-error.js";
import { Media } from "./media.model.js";

/** Only walk plain JSON-like objects — never ObjectIds, Dates, Buffers or Mongoose docs. */
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/** Finds every `mediaId` inside a (plain) document, however deeply nested. */
export function collectMediaIds(value: unknown, found = new Set<string>()): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectMediaIds(item, found);
  } else if (isPlainObject(value)) {
    const record = value;
    if (record.mediaId) found.add(String(record.mediaId));
    for (const [key, child] of Object.entries(record)) {
      if (key !== "mediaId") collectMediaIds(child, found);
    }
  }
  return [...found];
}

/**
 * Rejects references to media that doesn't exist, and refreshes each reference's
 * publicId/url/size from the library so clients can't point at arbitrary URLs.
 */
export async function resolveMediaRefs<T>(data: T): Promise<T> {
  const ids = collectMediaIds(data);
  if (ids.length === 0) return data;
  const media = await Media.find({
    _id: mongoose.trusted({ $in: ids.map((id) => new Types.ObjectId(id)) }),
  }).lean();
  const byId = new Map(media.map((m) => [String(m._id), m]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) throw badRequest("Some selected media no longer exists", { missing });

  const visit = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(visit);
    if (isPlainObject(value)) {
      const record = value;
      const out: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(record)) out[key] = visit(child);
      const source = record.mediaId ? byId.get(String(record.mediaId)) : undefined;
      if (source) {
        Object.assign(out, {
          publicId: source.publicId,
          url: source.url,
          width: source.width ?? null,
          height: source.height ?? null,
          format: source.format ?? "",
          resourceType: source.resourceType,
        });
      }
      return out;
    }
    return value;
  };
  return visit(data) as T;
}

type UsageOwner = { resource: string; documentId: Types.ObjectId; label: string };

/** Points the media library's `usedIn` lists at exactly the media this document references. */
export async function syncMediaUsage(owner: UsageOwner, mediaIds: string[]) {
  await Media.updateMany(
    { "usedIn.documentId": owner.documentId, "usedIn.resource": owner.resource },
    { $pull: { usedIn: { resource: owner.resource, documentId: owner.documentId } } },
  );
  if (mediaIds.length === 0) return;
  await Media.updateMany(
    { _id: mongoose.trusted({ $in: mediaIds.map((id) => new Types.ObjectId(id)) }) },
    { $push: { usedIn: owner } },
  );
}

export const clearMediaUsage = (resource: string, documentId: Types.ObjectId) =>
  syncMediaUsage({ resource, documentId, label: "" }, []);
