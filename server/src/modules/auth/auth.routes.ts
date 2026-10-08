import { Router } from "express";
import { requireCsrfHeader } from "../../middlewares/csrf.js";
import { loginLimiter, refreshLimiter } from "../../middlewares/rate-limit.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { validate } from "../../middlewares/validate.js";
import * as controller from "./auth.controller.js";
import { googleLoginSchema } from "./auth.schema.js";

export const authRoutes = Router()
  .use(requireCsrfHeader)
  .post("/google", loginLimiter, validate({ body: googleLoginSchema }), controller.googleLogin)
  .post("/refresh", refreshLimiter, controller.refresh)
  .post("/logout", controller.logout)
  .get("/me", requireAdmin, controller.me);
