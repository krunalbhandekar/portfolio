import { rateLimit, type Options } from "express-rate-limit";
import { sendError } from "../utils/response.js";

const handler: Options["handler"] = (_req, res, _next, options) =>
  sendError(res, options.statusCode, {
    code: "RATE_LIMITED",
    message: "Too many requests, please try again later.",
  });

const base = { standardHeaders: "draft-8", legacyHeaders: false, handler } as const;

/**
 * General limit for public and auth routes. Not applied to `/admin/*` (every request there
 * needs a valid session, and CMS editing is request-heavy) or to sign-out, which must
 * always work.
 */
export const apiLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 300,
  skip: (req) => req.path === "/auth/logout",
});

/** Sign-in attempts. */
export const loginLimiter = rateLimit({ ...base, windowMs: 15 * 60_000, limit: 20 });

/** Token refresh (called automatically by the admin app). */
export const refreshLimiter = rateLimit({ ...base, windowMs: 15 * 60_000, limit: 120 });
