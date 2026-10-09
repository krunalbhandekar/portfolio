import { Router } from "express";
import { requireJobsSecret } from "../../middlewares/jobs-secret.js";
import { sendSuccess } from "../../utils/response.js";
import { runBackup } from "../backup/backup.service.js";
import { publishScheduled } from "../schedule/schedule.service.js";

/** Scheduled jobs (portfolio.md §10 "Jobs"), triggered by cron-job.org. */
export const jobsRoutes = Router()
  .use(requireJobsSecret)
  .post("/publish-scheduled", async (_req, res) => sendSuccess(res, await publishScheduled()))
  .post("/backup", async (_req, res) => sendSuccess(res, await runBackup()));
