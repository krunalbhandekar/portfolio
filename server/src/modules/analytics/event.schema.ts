import { z } from "zod";
import { EVENT_TYPES } from "./event.model.js";

export const eventInput = z.object({
  type: z.enum(EVENT_TYPES),
  path: z
    .string()
    .trim()
    .max(200)
    .regex(/^\/(?!admin)/, "Site path")
    .default("/"),
  refId: z.string().trim().max(100).default(""),
  /** `document.referrer` as sent by the browser; reduced to its host on the server. */
  referrer: z.string().trim().max(500).default(""),
});

export const analyticsQuery = z.object({
  days: z.coerce.number().int().min(1).max(180).default(30),
});
