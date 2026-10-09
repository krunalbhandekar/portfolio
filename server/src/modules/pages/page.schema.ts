import { z } from "zod";
import { httpUrl, requiredText, richText, text } from "../shared/fields.js";

const common = {
  visible: z.boolean().default(false),
  title: text(80),
  intro: text(300),
  seo: z
    .object({ title: text(70), description: text(160) })
    .default({ title: "", description: "" }),
};

export const nowPageInput = z.object({ ...common, content: richText(20_000) });

export const usesPageInput = z.object({
  ...common,
  sections: z
    .array(
      z.object({
        title: requiredText(60),
        items: z
          .array(z.object({ name: requiredText(80), description: text(200), url: httpUrl }))
          .max(40)
          .default([]),
      }),
    )
    .max(20)
    .default([]),
});

export const faqPageInput = z.object({
  ...common,
  items: z
    .array(z.object({ question: requiredText(200), answer: richText(5_000) }))
    .max(50)
    .default([]),
});

export const PAGE_DEFAULTS = {
  now: {
    visible: false,
    title: "Now",
    intro: "",
    content: "",
    seo: { title: "", description: "" },
  },
  uses: {
    visible: false,
    title: "Uses",
    intro: "",
    sections: [],
    seo: { title: "", description: "" },
  },
  faq: { visible: false, title: "FAQ", intro: "", items: [], seo: { title: "", description: "" } },
} as const;
