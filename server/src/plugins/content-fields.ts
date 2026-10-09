import { Schema } from "mongoose";

export const CONTENT_STATUSES = ["draft", "published"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/**
 * Fields shared by every CMS content collection (portfolio.md §9): publishing state,
 * ordering, per-document SEO overrides, and who edited it last. Used from Phase 3.
 */
export function contentFieldsPlugin(schema: Schema) {
  schema.add({
    status: { type: String, enum: CONTENT_STATUSES, default: "draft", index: true },
    order: { type: Number, default: 0 },
    seo: {
      title: { type: String, trim: true, maxlength: 70 },
      description: { type: String, trim: true, maxlength: 160 },
      ogImage: { type: String, trim: true },
      canonical: { type: String, trim: true },
      noindex: { type: Boolean, default: false },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  });
  schema.set("timestamps", true);
}
