import { Schema } from "mongoose";
import { z } from "zod";
import { sanitizeRichText } from "../../lib/rich-text.js";
import { SLUG_PATTERN } from "../../utils/slug.js";

/*
 * Input conventions for CMS documents: forms always send the whole document, so optional
 * fields default to "" / [] / null instead of being omitted. That lets an update clear a
 * field simply by sending it empty.
 */

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const text = (max = 200) => z.string().trim().max(max).default("");
export const requiredText = (max = 200) => z.string().trim().min(1, "Required").max(max);

export const httpUrl = z
  .union([z.literal(""), z.url({ protocol: /^https?$/, message: "Must be an http(s) URL" })])
  .default("");

/** Link target: site-relative path, http(s) URL or mailto:. */
export const href = z
  .string()
  .trim()
  .max(500)
  .regex(/^(\/|https?:\/\/|mailto:|#)/, "Use /path, https://… or mailto:")
  .or(z.literal(""))
  .default("");

export const richText = (max = 50_000) =>
  z
    .string()
    .max(max)
    .default("")
    .transform((html) => sanitizeRichText(html));

export const stringList = (maxItems = 50, maxLength = 300) =>
  z.array(z.string().trim().min(1).max(maxLength)).max(maxItems).default([]);

export const slugList = (maxItems = 60) =>
  z.array(z.string().regex(SLUG_PATTERN, "Invalid slug")).max(maxItems).default([]);

export const idList = (maxItems = 100) => z.array(objectId).max(maxItems).default([]);

export const optionalSlug = z
  .union([z.literal(""), z.string().regex(SLUG_PATTERN, "Lowercase letters, numbers and dashes")])
  .default("");

export const nullableDate = z.union([z.null(), z.coerce.date()]).default(null);

export const nullableNumber = (min = 0, max = 1_000_000) =>
  z.union([z.null(), z.number().min(min).max(max)]).default(null);

/** Reference to an uploaded file (portfolio.md §9). Alt text is mandatory. */
export const mediaRef = z.object({
  mediaId: objectId,
  publicId: z.string().min(1).max(300),
  url: z.url(),
  alt: z.string().trim().min(1, "Alt text is required").max(300),
  width: z.number().int().positive().nullable().default(null),
  height: z.number().int().positive().nullable().default(null),
  format: z.string().max(20).default(""),
  resourceType: z.enum(["image", "raw"]).default("image"),
});
export type MediaRef = z.infer<typeof mediaRef>;

export const nullableMediaRef = mediaRef.nullable().default(null);

/** Mongoose shape for a media reference (stored denormalised for fast public reads). */
export const mediaRefSchema = new Schema(
  {
    mediaId: { type: Schema.Types.ObjectId, ref: "Media", required: true },
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    alt: { type: String, required: true },
    width: Number,
    height: Number,
    format: String,
    resourceType: { type: String, enum: ["image", "raw"], default: "image" },
  },
  { _id: false },
);
