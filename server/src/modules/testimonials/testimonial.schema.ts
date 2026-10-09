import { z } from "zod";
import { httpUrl, requiredText, text } from "../shared/fields.js";

export const RELATIONSHIPS = ["manager", "colleague", "client", "mentor", "other"] as const;

export const testimonialInput = z.object({
  quote: requiredText(1000),
  name: requiredText(80),
  role: text(80),
  company: text(80),
  relationship: z.enum(RELATIONSHIPS).default("colleague"),
  linkedinUrl: httpUrl,
});

/** Google ID token from the "Continue with Google" button. */
const credential = z.string().min(100).max(4096);

export const visitorVerifySchema = z.object({ credential });

export const visitorTestimonialSchema = z.object({
  credential,
  name: z.string().trim().min(2, "Please enter your name").max(80),
  role: z.string().trim().max(80).default(""),
  company: z.string().trim().max(80).default(""),
  relationship: z.enum(RELATIONSHIPS).default("client"),
  quote: z
    .string()
    .trim()
    .min(30, "Please write at least 30 characters")
    .max(1000, "Please keep it under 1000 characters"),
  linkedinUrl: z
    .union([
      z.literal(""),
      z
        .url({
          protocol: /^https$/,
          hostname: /(^|\.)linkedin\.com$/,
          message: "Use your LinkedIn profile link (https://www.linkedin.com/in/…)",
        })
        .max(300, "That link is too long"),
    ])
    .default(""),
  /** Honeypot: hidden from humans, so any value means a bot. */
  website: z.string().max(200).default(""),
});
