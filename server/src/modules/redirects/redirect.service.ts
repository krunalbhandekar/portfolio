import mongoose from "mongoose";
import { revalidate } from "../../services/revalidate.js";
import { Redirect } from "./redirect.model.js";

/**
 * Old public URL → new one after a slug change. Keeps the map flat (earlier redirects to the
 * old URL now point at the new one) and loop-free (a page that exists again isn't redirected).
 */
export async function addAutoRedirect(from: string, to: string) {
  if (!from || !to || from === to) return;
  await Redirect.deleteMany({ from: to });
  await Redirect.updateMany({ to: from }, { $set: { to } });
  await Redirect.findOneAndUpdate(
    { from },
    { $set: { to, statusCode: 301, auto: true, note: "Slug changed" } },
    { upsert: true },
  );
  void revalidate({ tags: ["redirects"] });
}

/** A path that now has real content must not keep redirecting away. */
export async function clearRedirectFrom(path: string) {
  const result = await Redirect.deleteMany({ from: path });
  if (result.deletedCount) void revalidate({ tags: ["redirects"] });
}

/** Public map for the site's proxy (small: one entry per renamed page). */
export async function getRedirectMap() {
  const items = await Redirect.find({}, { from: 1, to: 1, statusCode: 1, _id: 0 }).lean();
  return items.map((r) => ({ from: r.from, to: r.to, statusCode: r.statusCode ?? 301 }));
}

/** `?q=` search over both ends of a redirect. */
export function redirectFilter(q?: string) {
  if (!q) return {};
  const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return { $or: mongoose.trusted([{ from: pattern }, { to: pattern }]) };
}
