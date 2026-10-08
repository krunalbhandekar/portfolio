import { Router } from "express";
import { isDatabaseUp } from "../../config/db.js";
import { requireCsrfHeader } from "../../middlewares/csrf.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { sendSuccess } from "../../utils/response.js";
import { Admin } from "../admins/admin.model.js";

/**
 * Everything under /api/v1/admin is admin-only and CSRF-protected.
 * Content modules (Phase 3+) mount their routers here.
 */
export const adminRoutes = Router()
  .use(requireCsrfHeader, requireAdmin)
  .get("/dashboard", async (req, res) => {
    const admin = await Admin.findById(req.admin!.id, { lastLoginAt: 1 }).lean();
    sendSuccess(res, {
      lastLoginAt: admin?.lastLoginAt ?? null,
      database: isDatabaseUp() ? "up" : "down",
    });
  });
