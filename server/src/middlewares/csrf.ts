import type { RequestHandler } from "express";
import { corsOrigins } from "../config/env.js";
import { forbidden } from "../utils/app-error.js";

export const CSRF_HEADER = "x-requested-with";
export const CSRF_HEADER_VALUE = "portfolio";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF defence for cookie-authenticated routes (on top of SameSite=Lax cookies):
 * state-changing requests must carry a custom header, which cross-site forms can't send and
 * cross-origin scripts can't send without passing CORS. A foreign `Origin` is rejected outright.
 */
export const requireCsrfHeader: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get("origin");
  if (origin && !corsOrigins.includes(origin)) {
    return next(forbidden("Cross-site request blocked", "CSRF_ORIGIN_MISMATCH"));
  }
  if (req.get(CSRF_HEADER) !== CSRF_HEADER_VALUE) {
    return next(forbidden("Missing CSRF header", "CSRF_HEADER_MISSING"));
  }
  next();
};
