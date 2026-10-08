import { z } from "zod";
import { mediaRef, optionalSlug, requiredText, text } from "../shared/fields.js";

export const resumeInput = z.object({
  label: requiredText(80),
  /** Shareable variant key, e.g. "backend" → /resume?v=backend (Phase 6). */
  slug: optionalSlug,
  file: mediaRef.refine((file) => file.format === "pdf", "Resume must be a PDF"),
  isDefault: z.boolean().default(false),
  notes: text(200),
});
