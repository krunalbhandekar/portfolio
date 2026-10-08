import { model, Schema } from "mongoose";
import { contentFieldsPlugin } from "../../plugins/content-fields.js";
import { mediaRefSchema } from "../shared/fields.js";

const experienceSchema = new Schema({
  company: { type: String, required: true },
  companyUrl: String,
  companyLogo: mediaRefSchema,
  position: { type: String, required: true },
  employmentType: String,
  location: String,
  locationType: String,
  startDate: { type: Date, required: true },
  endDate: Date,
  isCurrent: { type: Boolean, default: false },
  summary: String,
  technologies: [String],
  responsibilities: [String],
  achievements: [String],
  projectIds: [{ type: Schema.Types.ObjectId, ref: "Project" }],
});
experienceSchema.plugin(contentFieldsPlugin);
experienceSchema.index({ status: 1, isCurrent: -1, startDate: -1 });

export const Experience = model("Experience", experienceSchema, "experiences");
