import { createHmac, randomBytes, randomUUID } from "node:crypto";
import type { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";
import { env, isProduction } from "../../config/env.js";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export const COOKIE_NAMES = {
  access: "pf_at",
  refresh: "pf_rt",
  /** Non-secret hint readable by the client ("a session probably exists"). Never trusted. */
  session: "pf_session",
} as const;

const JWT_OPTIONS = { issuer: "portfolio-api", audience: "portfolio-admin" } as const;

type AccessPayload = { sub: string; email: string };

export function signAccessToken(adminId: string, email: string) {
  return jwt.sign({ email } satisfies Omit<AccessPayload, "sub">, env.JWT_ACCESS_SECRET, {
    ...JWT_OPTIONS,
    subject: adminId,
    algorithm: "HS256",
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

/** Throws `jwt.TokenExpiredError` / `jwt.JsonWebTokenError` on invalid tokens. */
export function verifyAccessToken(token: string): AccessPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    ...JWT_OPTIONS,
    algorithms: ["HS256"],
  });
  if (typeof payload === "string" || !payload.sub || typeof payload.email !== "string") {
    throw new jwt.JsonWebTokenError("Malformed access token");
  }
  return { sub: payload.sub, email: payload.email };
}

export const generateRefreshToken = () => randomBytes(48).toString("base64url");
export const newTokenFamily = () => randomUUID();
export const hashRefreshToken = (token: string) =>
  createHmac("sha256", env.JWT_REFRESH_SECRET).update(token).digest("hex");

// Host-only cookies (no `domain`): the browser reaches the API through the site's own
// /api/v1 proxy, so the cookies belong to the site's domain and nothing else.
const baseCookie: CookieOptions = {
  secure: isProduction,
  sameSite: "lax",
};

// The refresh cookie is only sent to the auth endpoints, never to the rest of the API.
const REFRESH_COOKIE_PATH = "/api/v1/auth";

export function setSessionCookies(
  res: Response,
  { accessToken, refreshToken }: { accessToken: string; refreshToken?: string },
) {
  res.cookie(COOKIE_NAMES.access, accessToken, {
    ...baseCookie,
    httpOnly: true,
    path: "/",
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  });
  if (refreshToken) {
    res.cookie(COOKIE_NAMES.refresh, refreshToken, {
      ...baseCookie,
      httpOnly: true,
      path: REFRESH_COOKIE_PATH,
      maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
    });
    res.cookie(COOKIE_NAMES.session, "1", {
      ...baseCookie,
      httpOnly: false,
      path: "/",
      maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
    });
  }
}

export function clearSessionCookies(res: Response) {
  res.clearCookie(COOKIE_NAMES.access, { ...baseCookie, httpOnly: true, path: "/" });
  res.clearCookie(COOKIE_NAMES.refresh, {
    ...baseCookie,
    httpOnly: true,
    path: REFRESH_COOKIE_PATH,
  });
  res.clearCookie(COOKIE_NAMES.session, { ...baseCookie, httpOnly: false, path: "/" });
}
