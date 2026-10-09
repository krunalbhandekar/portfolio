import { Router } from "express";
import { requireCsrfHeader } from "../../middlewares/csrf.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { validate } from "../../middlewares/validate.js";
import { sendSuccess } from "../../utils/response.js";
import type { z } from "zod";
import { getAnalytics } from "../analytics/analytics.service.js";
import { analyticsQuery } from "../analytics/event.schema.js";
import { contentRoutes } from "../content.routes.js";
import { githubRoutes } from "../github/github.routes.js";
import { messagesRoutes } from "../messages/messages.routes.js";
import { getDashboard } from "./dashboard.service.js";
import { mediaRoutes } from "../media/media.routes.js";

/**
 * Everything under /api/v1/admin is admin-only and CSRF-protected.
 * Content modules (Phase 3+) mount their routers here.
 */
export const adminRoutes = Router()
  .use(requireCsrfHeader, requireAdmin)
  .get("/dashboard", async (req, res) => {
    sendSuccess(res, await getDashboard(req.admin!.id));
  })
  .get("/analytics", validate({ query: analyticsQuery }), async (req, res) => {
    const { days } = req.validatedQuery as z.infer<typeof analyticsQuery>;
    sendSuccess(res, await getAnalytics(days));
  })
  .use("/github", githubRoutes)
  .use("/messages", messagesRoutes)
  .use("/media", mediaRoutes)
  .use(contentRoutes);
