import { Router } from "express";
import { requireCsrfHeader } from "../../middlewares/csrf.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { sendSuccess } from "../../utils/response.js";
import { contentRoutes } from "../content.routes.js";
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
  .use("/messages", messagesRoutes)
  .use("/media", mediaRoutes)
  .use(contentRoutes);
