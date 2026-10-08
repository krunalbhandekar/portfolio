import { model, Schema } from "mongoose";
import { contentFieldsPlugin } from "../../plugins/content-fields.js";
import { mediaRefSchema } from "../shared/fields.js";

const resumeSchema = new Schema({
  label: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  file: { type: mediaRefSchema, required: true },
  isDefault: { type: Boolean, default: false },
  notes: String,
  downloadCount: { type: Number, default: 0 },
});
resumeSchema.plugin(contentFieldsPlugin);

export const Resume = model("Resume", resumeSchema, "resumes");
