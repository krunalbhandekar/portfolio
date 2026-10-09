import { z } from "zod";
import { nullableDate, objectId, requiredText, text } from "../shared/fields.js";

export const achievementInput = z.object({
  title: requiredText(120),
  description: text(400),
  /** Headline number, e.g. "60%" or "10k+". Only verifiable figures. */
  metric: text(40),
  date: nullableDate,
  projectId: z.union([z.null(), objectId]).default(null),
});
