import { z } from "zod";
import { REDIRECT_STATUS_CODES } from "./redirect.model.js";

/** Site path to redirect from: never admin/API/framework paths. */
export const fromPath = z
  .string()
  .trim()
  .max(300)
  .regex(/^\/(?!\/)[^\s?#]*$/, "Start with a single / (no query string)")
  .refine(
    (p) => !/^\/(admin|api|_next)(\/|$)/.test(p),
    "Admin, API and _next paths can't be redirected",
  )
  .transform((p) => (p.length > 1 ? p.replace(/\/+$/, "") : p));

export const redirectInput = z
  .object({
    from: fromPath,
    to: z
      .string()
      .trim()
      .max(500)
      // "//host" is protocol-relative (another site): only real paths or explicit https URLs.
      .regex(/^(\/(?!\/)[^\s]*|https:\/\/\S+)$/, "Use a site path (/new) or an https:// URL"),
    statusCode: z.coerce
      .number()
      .refine(
        (c) => (REDIRECT_STATUS_CODES as readonly number[]).includes(c),
        "Use 301, 302, 307 or 308",
      )
      .default(301),
    note: z.string().trim().max(200).default(""),
  })
  .refine((r) => r.from !== r.to, { message: "Can't redirect a page to itself", path: ["to"] });
