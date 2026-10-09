import { model, Schema } from "mongoose";
import { contentFieldsPlugin } from "../../plugins/content-fields.js";
import { mediaRefSchema } from "../shared/fields.js";

const testimonialSchema = new Schema({
  quote: { type: String, required: true },
  name: { type: String, required: true },
  role: String,
  company: String,
  relationship: String,
  photo: mediaRefSchema,
  linkedinUrl: String,
});
testimonialSchema.plugin(contentFieldsPlugin);

export const Testimonial = model("Testimonial", testimonialSchema, "testimonials");
