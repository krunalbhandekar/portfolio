import { timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { AppError, unauthorized } from "../utils/app-error.js";

/** Guards /jobs/* (called by cron-job.org with header `x-jobs-secret: JOBS_SECRET`). */
export const requireJobsSecret: RequestHandler = (req, _res, next) => {
  if (!env.JOBS_SECRET) {
    return next(new AppError(503, "JOBS_DISABLED", "JOBS_SECRET is not configured"));
  }
  const provided = Buffer.from(req.get("x-jobs-secret") ?? "");
  const expected = Buffer.from(env.JOBS_SECRET);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return next(unauthorized("Invalid jobs secret", "JOBS_UNAUTHORIZED"));
  }
  next();
};
