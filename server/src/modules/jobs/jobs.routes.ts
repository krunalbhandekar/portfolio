import { Router } from "express";
import { requireJobsSecret } from "../../middlewares/jobs-secret.js";
import { sendSuccess } from "../../utils/response.js";
import { syncGithub } from "../github/github.service.js";

/** Scheduled jobs (portfolio.md §10 "Jobs"), triggered by cron-job.org. */
export const jobsRoutes = Router()
  .use(requireJobsSecret)
  .post("/github-sync", async (_req, res) => sendSuccess(res, await syncGithub()));
