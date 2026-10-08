import type { Model } from "mongoose";
import mongoose from "mongoose";

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Returns `base`, or `base-2`, `base-3`… — the first slug not used by another document. */
export async function uniqueSlug(model: Model<unknown>, base: string, excludeId?: string) {
  const root = base || "item";
  for (let n = 1; n < 1000; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const filter: Record<string, unknown> = { slug: candidate };
    if (excludeId) filter._id = mongoose.trusted({ $ne: new mongoose.Types.ObjectId(excludeId) });
    if (!(await model.exists(filter))) return candidate;
  }
  throw new Error(`Could not find a free slug for "${root}"`);
}
