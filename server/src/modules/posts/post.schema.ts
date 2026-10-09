import { z } from "zod";
import {
  httpUrl,
  nullableDate,
  nullableMediaRef,
  optionalSlug,
  requiredText,
  richText,
  text,
} from "../shared/fields.js";

/** Lower-case tags, e.g. "mongodb", "system-design". */
const tag = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(30)
  .regex(/^[a-z0-9][a-z0-9 .+#-]*$/, "Letters, numbers, spaces, . + # - only");

export const postInput = z.object({
  title: requiredText(140),
  slug: optionalSlug,
  excerpt: requiredText(300),
  content: richText(100_000),
  coverImage: nullableMediaRef,
  category: text(40),
  tags: z.array(tag).max(10).default([]),
  /** Set automatically on first publish; editable to back-date imported posts. */
  publishedAt: nullableDate,
  /** Optional cross-post (LinkedIn article/post, dev.to…). */
  crossPostUrl: httpUrl,
  seo: z
    .object({ title: text(70), description: text(160), noindex: z.boolean().default(false) })
    .default({ title: "", description: "", noindex: false }),
});

/** ~220 words per minute; code blocks count like prose (close enough for technical posts). */
export function postReadingTime(html: unknown) {
  const words = String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
