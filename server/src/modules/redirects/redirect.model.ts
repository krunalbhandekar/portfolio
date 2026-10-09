import { model, Schema } from "mongoose";

export const REDIRECT_STATUS_CODES = [301, 302, 307, 308] as const;

/** Old URL → new URL (portfolio.md §4 #14). Slug changes create these automatically. */
const redirectSchema = new Schema(
  {
    from: { type: String, required: true, unique: true },
    to: { type: String, required: true },
    statusCode: { type: Number, enum: REDIRECT_STATUS_CODES, default: 301 },
    /** Created automatically by a slug change (vs. added by hand). */
    auto: { type: Boolean, default: false },
    note: String,
  },
  { timestamps: true },
);

export const Redirect = model("Redirect", redirectSchema, "redirects");
