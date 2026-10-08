import { z } from "zod";
import { href, idList, requiredText, slugList, text } from "../shared/fields.js";

export const HOMEPAGE_SECTIONS = [
  "hero",
  "stats",
  "bento",
  "featuredProjects",
  "about",
  "career",
  "expertise",
  "caseStudies",
  "testimonials",
  "blog",
] as const;

export const BENTO_KINDS = ["currently-building", "location", "stack", "github", "custom"] as const;
export const EXPERTISE_AREAS = ["Frontend", "Backend", "Database", "DevOps", "Other"] as const;

export const homepageInput = z.object({
  hero: z
    .object({
      eyebrow: text(40),
      headline: text(120),
      subheadline: text(120),
      positioning: text(300),
      stack: slugList(8),
    })
    .default({ eyebrow: "", headline: "", subheadline: "", positioning: "", stack: [] }),
  ctas: z
    .array(
      z.object({
        label: requiredText(40),
        href: href.refine((v) => v !== "", "Required"),
        variant: z.enum(["primary", "outline", "ghost"]).default("primary"),
      }),
    )
    .max(4)
    .default([]),
  stats: z
    .array(z.object({ value: requiredText(20), label: requiredText(60) }))
    .max(6)
    .default([]),
  bento: z
    .array(
      z.object({
        kind: z.enum(BENTO_KINDS),
        title: text(80),
        body: text(300),
        href,
        size: z.enum(["sm", "md", "lg"]).default("sm"),
      }),
    )
    .max(8)
    .default([]),
  expertise: z
    .array(z.object({ area: z.enum(EXPERTISE_AREAS), summary: text(300), skills: slugList(12) }))
    .max(6)
    .default([]),
  /** Order of this array = order on the page. */
  sections: z
    .array(z.object({ key: z.enum(HOMEPAGE_SECTIONS), visible: z.boolean().default(true) }))
    .max(HOMEPAGE_SECTIONS.length)
    .refine((list) => new Set(list.map((s) => s.key)).size === list.length, "Duplicate section")
    .default(HOMEPAGE_SECTIONS.map((key) => ({ key, visible: true }))),
  featuredProjectIds: idList(6),
  nowSnippet: text(200),
});
