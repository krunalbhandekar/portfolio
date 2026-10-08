import { model, Schema } from "mongoose";
import { contentFieldsPlugin } from "../../plugins/content-fields.js";

const skillSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: String,
  icon: String,
  levelLabel: String,
  years: Number,
  projectIds: [{ type: Schema.Types.ObjectId, ref: "Project" }],
});
skillSchema.plugin(contentFieldsPlugin);

export const Skill = model("Skill", skillSchema, "skills");
