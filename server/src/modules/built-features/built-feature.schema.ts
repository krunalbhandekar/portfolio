import { z } from "zod";
import { objectId, requiredText, slugList, text } from "../shared/fields.js";

export const FEATURE_AREAS = [
  "frontend",
  "backend",
  "full-stack",
  "database",
  "devops",
  "integration",
] as const;

export const builtFeatureInput = z.object({
  feature: requiredText(100),
  description: text(300),
  area: z.enum(FEATURE_AREAS),
  technologies: slugList(12),
  projectId: z.union([z.null(), objectId]).default(null),
});
