import { model, Schema } from "mongoose";
import { contentFieldsPlugin } from "../../plugins/content-fields.js";
import { mediaRefSchema } from "../shared/fields.js";

const postSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: String,
  content: String,
  coverImage: mediaRefSchema,
  category: String,
  tags: { type: [String], index: true },
  publishedAt: Date,
  crossPostUrl: String,
  readingTime: { type: Number, default: 1 },
});
postSchema.plugin(contentFieldsPlugin);
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index(
  { title: "text", excerpt: "text", tags: "text", content: "text" },
  { weights: { title: 10, tags: 5, excerpt: 3, content: 1 }, name: "post_text" },
);

export const Post = model("Post", postSchema, "posts");
