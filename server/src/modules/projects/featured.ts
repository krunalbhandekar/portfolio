import { Types } from "mongoose";
import { Homepage } from "../homepage/homepage.model.js";

/**
 * "Featured" projects are chosen in one place: Admin → Homepage → Featured projects (max 6,
 * in order). The home page shows all of them, /hire the first 3, and every project card
 * across the site gets the ★ Featured badge and is listed first.
 */
export async function getFeaturedIds(): Promise<string[]> {
  const homepage = await Homepage.findOne({ key: "default" }, { featuredProjectIds: 1 }).lean();
  return (homepage?.featuredProjectIds ?? []).map(String);
}

/** Adds `featured` (from the Homepage list), overriding anything stored on old documents. */
export function markFeatured<T extends { _id: Types.ObjectId | string }>(
  projects: T[],
  ids: string[],
) {
  const set = new Set(ids);
  return projects.map((p) => ({ ...p, featured: set.has(String(p._id)) }));
}

/** Featured projects first (in Homepage order), then the rest in their existing order. */
export function featuredFirst<T extends { _id: Types.ObjectId | string }>(
  projects: T[],
  ids: string[],
) {
  const rank = new Map(ids.map((id, i) => [id, i]));
  return [...projects]
    .map((p, i) => ({ p, i, r: rank.get(String(p._id)) ?? Infinity }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map(({ p }) => p);
}
