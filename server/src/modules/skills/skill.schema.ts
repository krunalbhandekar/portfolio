import { z } from "zod";
import { idList, nullableNumber, optionalSlug, requiredText, text } from "../shared/fields.js";

export const SKILL_CATEGORIES = [
  "frontend",
  "backend",
  "database",
  "devops",
  "cloud",
  "tools",
  "other",
] as const;

export const skillInput = z.object({
  name: requiredText(60),
  slug: optionalSlug,
  category: z.enum(SKILL_CATEGORIES),
  /** Logo key from the client's tech-icon registry (usually equal to the slug). */
  icon: text(60),
  /** Experience in words, e.g. "Daily use", "Production experience" — no percentages. */
  levelLabel: text(40),
  years: nullableNumber(0, 50),
  projectIds: idList(50),
});
