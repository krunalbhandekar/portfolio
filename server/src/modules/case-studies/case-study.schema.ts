import { z } from "zod";
import {
  nullableMediaRef,
  objectId,
  optionalSlug,
  requiredText,
  richText,
  text,
} from "../shared/fields.js";

/** Section types follow the case-study arc in portfolio.md §3.7. */
export const CASE_STUDY_SECTIONS = [
  "problem",
  "requirements",
  "constraints",
  "architecture",
  "database",
  "api",
  "implementation",
  "challenges",
  "solution",
  "result",
  "learnings",
  "custom",
] as const;

export const caseStudyInput = z.object({
  title: requiredText(140),
  slug: optionalSlug,
  summary: requiredText(300),
  projectId: z.union([z.null(), objectId]).default(null),
  coverImage: nullableMediaRef,
  featured: z.boolean().default(false),
  sections: z
    .array(
      z.object({
        type: z.enum(CASE_STUDY_SECTIONS),
        heading: text(120),
        content: richText(30_000),
      }),
    )
    .max(20)
    .default([]),
  seo: z
    .object({ title: text(70), description: text(160), noindex: z.boolean().default(false) })
    .default({ title: "", description: "", noindex: false }),
});

/** ~220 words per minute over all section text. */
export function readingTimeMinutes(sections: { content?: unknown }[] = []) {
  const words = sections
    .map((s) => String(s.content ?? "").replace(/<[^>]+>/g, " "))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
