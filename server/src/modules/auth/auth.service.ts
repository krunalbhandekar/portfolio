import type { Request } from "express";
import type { Types } from "mongoose";
import { env } from "../../config/env.js";
import { verifyGoogleIdToken } from "../../lib/google.js";
import { forbidden, unauthorized } from "../../utils/app-error.js";
import { Admin } from "../admins/admin.model.js";
import { recordAudit } from "../audit/audit.service.js";
import {
  generateRefreshToken,
  hashRefreshToken,
  newTokenFamily,
  REFRESH_TOKEN_TTL_SECONDS,
  signAccessToken,
} from "./auth.tokens.js";
import { RefreshToken } from "./refresh-token.model.js";

/** A rotated token presented again within this window is treated as a benign race (two tabs). */
const REUSE_GRACE_MS = 30_000;

export const isAdminEmail = (email: string) =>
  email.trim().toLowerCase() === env.ADMIN_EMAIL.toLowerCase();

async function createSession(
  req: Request,
  admin: { _id: Types.ObjectId; email: string },
  familyId: string = newTokenFamily(),
): Promise<{ accessToken: string; refreshToken: string; tokenHash: string }> {
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  await RefreshToken.create({
    adminId: admin._id,
    tokenHash,
    familyId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    userAgent: req.get("user-agent"),
    ip: req.ip,
  });
  return {
    accessToken: signAccessToken(admin._id.toString(), admin.email),
    refreshToken,
    tokenHash,
  };
}

/** Verifies a Google ID token and signs in the single allow-listed admin. */
export async function loginWithGoogle(req: Request, credential: string) {
  const payload = await verifyGoogleIdToken(credential);

  if (!payload?.email) {
    await recordAudit(req, {
      action: "auth.login",
      outcome: "failure",
      meta: { reason: "invalid_token" },
    });
    throw unauthorized("Google sign-in could not be verified", "INVALID_GOOGLE_TOKEN");
  }

  const email = payload.email.toLowerCase();
  if (payload.email_verified !== true || !isAdminEmail(email)) {
    await recordAudit(req, {
      action: "auth.login",
      outcome: "failure",
      meta: { reason: payload.email_verified ? "not_admin" : "email_unverified", email },
    });
    throw forbidden("This Google account is not authorized to access the admin panel", "NOT_ADMIN");
  }

  const admin = await Admin.findOneAndUpdate(
    { email },
    {
      $set: {
        googleId: payload.sub,
        name: payload.name,
        avatar: payload.picture,
        lastLoginAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const { accessToken, refreshToken } = await createSession(req, admin);
  await recordAudit(req, { action: "auth.login", adminId: admin._id });
  return { admin, accessToken, refreshToken };
}

/**
 * Rotates a refresh token: the presented token is revoked and a new one issued in the same
 * family. Presenting an already-rotated token outside the grace window means it was stolen,
 * so the entire family is revoked.
 */
export async function refreshSession(req: Request, presentedToken: string | undefined) {
  if (!presentedToken) throw unauthorized("No refresh token", "NO_REFRESH_TOKEN");

  const tokenHash = hashRefreshToken(presentedToken);
  const stored = await RefreshToken.findOne({ tokenHash });
  if (!stored || stored.expiresAt.getTime() <= Date.now()) {
    throw unauthorized("Session expired, please sign in again", "SESSION_EXPIRED");
  }

  const admin = await Admin.findById(stored.adminId);
  if (!admin || !isAdminEmail(admin.email)) {
    await RefreshToken.updateMany(
      { adminId: stored.adminId, revokedAt: null },
      { revokedAt: new Date() },
    );
    throw unauthorized("Session no longer valid", "SESSION_REVOKED");
  }

  if (stored.revokedAt) {
    const sinceRevoked = Date.now() - stored.revokedAt.getTime();
    if (stored.replacedByHash && sinceRevoked < REUSE_GRACE_MS) {
      // Concurrent refresh from another tab: that tab already received the new refresh cookie,
      // so only hand out a fresh access token.
      return { admin, accessToken: signAccessToken(admin._id.toString(), admin.email) };
    }
    await RefreshToken.updateMany(
      { familyId: stored.familyId, revokedAt: null },
      { revokedAt: new Date() },
    );
    await recordAudit(req, {
      action: "auth.refresh_reuse",
      outcome: "failure",
      adminId: admin._id,
      meta: { familyId: stored.familyId },
    });
    throw unauthorized("Session revoked, please sign in again", "SESSION_REVOKED");
  }

  const next = await createSession(req, admin, stored.familyId);
  stored.revokedAt = new Date();
  stored.replacedByHash = next.tokenHash;
  await stored.save();

  return { admin, accessToken: next.accessToken, refreshToken: next.refreshToken };
}

/** Revokes the presented refresh token (if any). Always succeeds. */
export async function logout(req: Request, presentedToken: string | undefined) {
  const revoked = presentedToken
    ? await RefreshToken.findOneAndUpdate(
        { tokenHash: hashRefreshToken(presentedToken), revokedAt: null },
        { revokedAt: new Date() },
      )
    : null;
  if (revoked) await recordAudit(req, { action: "auth.logout", adminId: revoked.adminId });
}
