import { z } from "zod";
import { httpUrl, nullableDate, requiredText, text } from "../shared/fields.js";

export const CERTIFICATION_TYPES = [
  "degree",
  "bootcamp",
  "certification",
  "course",
  "workshop",
  "talk",
  "award",
] as const;

export const certificationInput = z.object({
  title: requiredText(150),
  institution: text(120),
  type: z.enum(CERTIFICATION_TYPES).default("certification"),
  date: nullableDate,
  /** Link to the certificate or its verification page (no uploads: saves Cloudinary storage). */
  verifyUrl: httpUrl,
  description: text(300),
});
