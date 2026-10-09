import { model, Schema } from "mongoose";
import { contentFieldsPlugin } from "../../plugins/content-fields.js";

const certificationSchema = new Schema({
  title: { type: String, required: true },
  institution: String,
  type: { type: String },
  date: Date,
  verifyUrl: String,
  description: String,
});
certificationSchema.plugin(contentFieldsPlugin);

export const Certification = model("Certification", certificationSchema, "certifications");
