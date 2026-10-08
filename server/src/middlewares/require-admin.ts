import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { Admin } from "../modules/admins/admin.model.js";
import { isAdminEmail } from "../modules/auth/auth.service.js";
import { COOKIE_NAMES, verifyAccessToken } from "../modules/auth/auth.tokens.js";
import { unauthorized } from "../utils/app-error.js";

/**
 * Requires a valid access-token cookie belonging to the allow-listed admin.
 * Expired tokens get code `TOKEN_EXPIRED` so the client knows to call /auth/refresh.
 */
export const requireAdmin: RequestHandler = async (req, _res, next) => {
  const token: unknown = req.cookies?.[COOKIE_NAMES.access];
  if (typeof token !== "string" || !token) throw unauthorized();

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError)
      throw unauthorized("Access token expired", "TOKEN_EXPIRED");
    throw unauthorized("Invalid access token", "INVALID_TOKEN");
  }

  if (!isAdminEmail(payload.email) || !Types.ObjectId.isValid(payload.sub)) {
    throw unauthorized("Invalid access token", "INVALID_TOKEN");
  }
  const exists = await Admin.exists({ _id: payload.sub });
  if (!exists) throw unauthorized("Admin account not found", "INVALID_TOKEN");

  req.admin = { id: new Types.ObjectId(payload.sub), email: payload.email };
  next();
};
