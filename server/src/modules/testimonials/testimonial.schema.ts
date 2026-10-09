import { z } from "zod";
import { httpUrl, nullableMediaRef, requiredText, text } from "../shared/fields.js";

export const RELATIONSHIPS = ["manager", "colleague", "client", "mentor", "other"] as const;

export const testimonialInput = z.object({
  quote: requiredText(1000),
  name: requiredText(80),
  role: text(80),
  company: text(80),
  relationship: z.enum(RELATIONSHIPS).default("colleague"),
  photo: nullableMediaRef,
  linkedinUrl: httpUrl,
});
