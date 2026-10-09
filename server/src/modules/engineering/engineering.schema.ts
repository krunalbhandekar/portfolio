import { z } from "zod";
import { objectId, optionalSlug, requiredText, richText, text } from "../shared/fields.js";

export const ENGINEERING_TYPES = ["architecture", "api", "database", "devops", "decision"] as const;
export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export const API_AUTH = ["none", "user", "admin", "api-key"] as const;
export const PARAM_LOCATIONS = ["path", "query", "body", "header"] as const;

const apiSpec = z
  .object({
    method: z.enum(HTTP_METHODS).default("GET"),
    path: text(200),
    auth: z.enum(API_AUTH).default("none"),
    params: z
      .array(
        z.object({
          name: requiredText(60),
          location: z.enum(PARAM_LOCATIONS).default("query"),
          type: text(40),
          required: z.boolean().default(false),
          description: text(200),
        }),
      )
      .max(30)
      .default([]),
    requestExample: text(5000),
    responseExample: text(5000),
    statusCodes: z
      .array(z.object({ code: requiredText(5), description: text(150) }))
      .max(15)
      .default([]),
  })
  .default({
    method: "GET",
    path: "",
    auth: "none",
    params: [],
    requestExample: "",
    responseExample: "",
    statusCodes: [],
  });

/**
 * One entry in the Engineering section (portfolio.md §3.8). `content` is the explanation
 * (for decisions: the answer, with `title` as the question); `api` is only used by type "api".
 */
export const engineeringInput = z.object({
  type: z.enum(ENGINEERING_TYPES),
  title: requiredText(160),
  slug: optionalSlug,
  summary: text(300),
  content: richText(20_000),
  diagram: text(10_000),
  projectId: z.union([z.null(), objectId]).default(null),
  api: apiSpec,
});
