import type { RequestHandler } from "express";

const isUnsafeKey = (key: string) => key.startsWith("$") || key.includes(".");

function stripOperators(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(stripOperators);
    return;
  }
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      if (isUnsafeKey(key)) delete (value as Record<string, unknown>)[key];
      else stripOperators((value as Record<string, unknown>)[key]);
    }
  }
}

/**
 * Removes `$`-prefixed and dotted keys from JSON bodies (NoSQL injection).
 * Replaces `express-mongo-sanitize`, which is incompatible with Express 5. Query strings use
 * Express 5's "simple" parser (no nested objects), and Mongoose `sanitizeFilter` is on as well.
 */
export const sanitizeBody: RequestHandler = (req, _res, next) => {
  stripOperators(req.body);
  next();
};
