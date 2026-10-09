import { model, Schema } from "mongoose";
import { contentFieldsPlugin } from "../../plugins/content-fields.js";

export const TESTIMONIAL_SOURCES = ["admin", "visitor"] as const;

const testimonialSchema = new Schema({
  quote: { type: String, required: true },
  name: { type: String, required: true },
  role: String,
  company: String,
  relationship: String,
  linkedinUrl: String,
  /** Who created it: the site owner in the admin, or a visitor via /testimonials/write. */
  source: { type: String, enum: TESTIMONIAL_SOURCES, default: "admin" },
  /** Visitor submissions only: the verified Google account (email is never public). */
  submittedBy: {
    type: new Schema(
      {
        googleId: { type: String, required: true },
        email: String,
        picture: String,
        submittedAt: Date,
      },
      { _id: false },
    ),
    default: undefined,
  },
});
testimonialSchema.plugin(contentFieldsPlugin);
// One testimonial per Google account; deleting it frees the account to submit again.
testimonialSchema.index(
  { "submittedBy.googleId": 1 },
  { unique: true, partialFilterExpression: { "submittedBy.googleId": { $type: "string" } } },
);

export const Testimonial = model("Testimonial", testimonialSchema, "testimonials");
