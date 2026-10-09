import { model, Schema } from "mongoose";
import { singletonFields, sub } from "../shared/mongoose.js";

export const PAGE_KEYS = ["now", "uses", "faq"] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

/** Simple pages (portfolio.md §3.16, §4 #16–17): one document per key in `pages`. */
const pageSchema = new Schema(
  {
    ...singletonFields,
    visible: { type: Boolean, default: false },
    title: String,
    intro: String,
    /** /now: rich text. */
    content: String,
    /** /uses: groups of tools. */
    sections: [
      sub({
        title: String,
        items: [sub({ name: String, description: String, url: String })],
      }),
    ],
    /** /faq: questions and rich-text answers. */
    items: [sub({ question: String, answer: String })],
    seo: sub({ title: String, description: String }),
  },
  { timestamps: true },
);

export const Page = model("Page", pageSchema, "pages");
