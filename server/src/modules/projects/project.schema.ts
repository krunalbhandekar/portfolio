import { z } from "zod";
import {
  flowDiagram,
  httpUrl,
  mediaRef,
  nullableDate,
  nullableMediaRef,
  nullableNumber,
  objectId,
  optionalSlug,
  requiredText,
  richText,
  slugList,
  stringList,
  text,
} from "../shared/fields.js";

export const PROJECT_CATEGORIES = [
  "full-stack",
  "frontend",
  "backend",
  "devops",
  "api",
  "saas",
  "internal-tool",
  "side-project",
] as const;
export const PROJECT_TYPES = ["professional", "personal"] as const;
export const PROJECT_STATUSES = ["completed", "in-progress", "maintained", "archived"] as const;

export const projectInput = z.object({
  title: requiredText(120),
  slug: optionalSlug,
  summary: requiredText(300),
  category: z.enum(PROJECT_CATEGORIES),
  type: z.enum(PROJECT_TYPES),
  role: text(120),
  duration: text(40),
  startDate: nullableDate,
  endDate: nullableDate,
  teamSize: nullableNumber(1, 500),
  projectStatus: z.enum(PROJECT_STATUSES).default("completed"),
  technologies: slugList(30),
  featured: z.boolean().default(false),
  /** Professional work under NDA: redacted visuals, no code or internal links (portfolio.md §3.5). */
  confidential: z.boolean().default(false),
  thumbnail: nullableMediaRef,
  gallery: z
    .array(mediaRef.extend({ caption: text(200) }))
    .max(20)
    .default([]),
  videoUrl: httpUrl,
  liveUrl: httpUrl,
  repoUrl: httpUrl,
  demoCredentials: z
    .object({ username: text(80), password: text(80), note: text(200) })
    .default({ username: "", password: "", note: "" }),
  problem: richText(),
  solution: richText(),
  contributions: stringList(30, 300),
  features: stringList(40, 200),
  architecture: z
    .object({
      description: richText(),
      diagram: text(10_000),
      image: nullableMediaRef,
      flow: flowDiagram,
    })
    .default({ description: "", diagram: "", image: null, flow: { nodes: [], edges: [] } }),
  challenges: z
    .array(
      z.object({ challenge: requiredText(500), solution: requiredText(1000), result: text(500) }),
    )
    .max(12)
    .default([]),
  decisions: z
    .array(z.object({ question: requiredText(200), answer: requiredText(1500) }))
    .max(12)
    .default([]),
  metrics: z
    .array(z.object({ label: requiredText(80), value: requiredText(30) }))
    .max(8)
    .default([]),
  experienceId: z.union([z.null(), objectId]).default(null),
  seo: z
    .object({ title: text(70), description: text(160), noindex: z.boolean().default(false) })
    .default({ title: "", description: "", noindex: false }),
});
