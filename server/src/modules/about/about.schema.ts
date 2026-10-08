import { z } from "zod";
import { nullableMediaRef, requiredText, richText, stringList, text } from "../shared/fields.js";

export const aboutInput = z.object({
  headline: text(120),
  story: richText(),
  portrait: nullableMediaRef,
  education: z
    .array(
      z.object({
        institution: requiredText(120),
        degree: text(120),
        field: text(120),
        startYear: text(10),
        endYear: text(10),
        description: text(500),
      }),
    )
    .max(10)
    .default([]),
  journey: z
    .array(z.object({ period: requiredText(30), title: requiredText(100), description: text(500) }))
    .max(20)
    .default([]),
  values: z
    .array(z.object({ title: requiredText(60), description: text(300) }))
    .max(10)
    .default([]),
  domains: stringList(20, 60),
});
