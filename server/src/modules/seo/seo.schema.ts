import { z } from "zod";
import { text } from "../shared/fields.js";

/** Fixed (non-slug) public pages whose title/description can be overridden. */
export const SEO_PAGES = [
  "/",
  "/projects",
  "/case-studies",
  "/blog",
  "/engineering",
  "/built",
  "/experience",
  "/skills",
  "/about",
  "/hire",
  "/resume",
  "/contact",
  "/now",
  "/uses",
  "/faq",
] as const;

export const seoInput = z.object({
  pages: z
    .array(
      z.object({
        path: z.enum(SEO_PAGES),
        title: text(70),
        description: text(160),
        noindex: z.boolean().default(false),
      }),
    )
    .max(SEO_PAGES.length)
    .refine((pages) => new Set(pages.map((p) => p.path)).size === pages.length, "Each page once")
    .default([]),
});
