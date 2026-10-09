import { model, Schema } from "mongoose";

export const EVENT_TYPES = [
  "page_view",
  "project_view",
  "case_study_view",
  "post_view",
  "resume_download",
] as const;

/** Days analytics events are kept (Atlas M0 has 512 MB; see portfolio.md §9 Indexes). */
export const EVENT_TTL_DAYS = 180;

/**
 * Privacy-friendly analytics: no cookies, IPs or user agents stored — only what happened,
 * where, and the referring site's host.
 */
const eventSchema = new Schema(
  {
    type: { type: String, enum: EVENT_TYPES, required: true },
    /** Slug of the project/post/case study, or the resume id. */
    refId: String,
    path: String,
    /** Referring host, e.g. "linkedin.com" (external referrers only). */
    referrer: String,
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
eventSchema.index({ createdAt: 1 }, { expireAfterSeconds: EVENT_TTL_DAYS * 24 * 60 * 60 });
eventSchema.index({ type: 1, createdAt: -1 });

export const Event = model("Event", eventSchema, "events");
