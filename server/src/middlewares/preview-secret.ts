import { timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { unauthorized } from "../utils/app-error.js";

/**
 * Guards draft-preview endpoints. Only the Next.js server calls them (from Draft Mode), with
 * the same shared secret it uses for revalidation, so no extra env var is needed.
 */
export const requirePreviewSecret: RequestHandler = (req, _res, next) => {
  const provided = Buffer.from(req.get("x-preview-secret") ?? "");
  const expected = Buffer.from(env.REVALIDATE_SECRET);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return next(unauthorized("Preview not authorized", "PREVIEW_UNAUTHORIZED"));
  }
  next();
};
