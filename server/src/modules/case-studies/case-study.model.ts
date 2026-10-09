import { model, Schema } from "mongoose";
import { contentFieldsPlugin } from "../../plugins/content-fields.js";
import { mediaRefSchema } from "../shared/fields.js";
import { sub } from "../shared/mongoose.js";

const caseStudySchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  summary: String,
  projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
  coverImage: mediaRefSchema,
  featured: { type: Boolean, default: false },
  sections: [sub({ type: { type: String }, heading: String, content: String })],
  readingTime: { type: Number, default: 1 },
});
caseStudySchema.plugin(contentFieldsPlugin);
caseStudySchema.index({ status: 1, featured: -1, order: 1 });

export const CaseStudy = model("CaseStudy", caseStudySchema, "caseStudies");
