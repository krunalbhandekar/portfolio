import { rateLimit, type Options } from "express-rate-limit";
import { sendError } from "../utils/response.js";

const handler: Options["handler"] = (_req, res, _next, options) =>
  sendError(res, options.statusCode, {
    code: "RATE_LIMITED",
    message: "Too many requests, please try again later.",
  });

const base = { standardHeaders: "draft-8", legacyHeaders: false, handler } as const;

/** Applied to the whole API. */
export const apiLimiter = rateLimit({ ...base, windowMs: 15 * 60_000, limit: 300 });

/** Sign-in attempts. */
export const loginLimiter = rateLimit({ ...base, windowMs: 15 * 60_000, limit: 20 });

/** Token refresh (called automatically by the admin app). */
export const refreshLimiter = rateLimit({ ...base, windowMs: 15 * 60_000, limit: 120 });
