import { model, Schema } from "mongoose";
import { singletonFields, sub } from "../shared/mongoose.js";

/** Per-page SEO overrides for the site's fixed pages (content items have their own SEO fields). */
const seoSchema = new Schema(
  {
    ...singletonFields,
    pages: [sub({ path: String, title: String, description: String, noindex: Boolean })],
  },
  { timestamps: true },
);

export const SeoSettings = model("SeoSettings", seoSchema, "seoSettings");
