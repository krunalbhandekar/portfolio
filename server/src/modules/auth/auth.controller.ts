import type { Request, Response } from "express";
import { notFound } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/response.js";
import { Admin } from "../admins/admin.model.js";
import * as authService from "./auth.service.js";
import { clearSessionCookies, COOKIE_NAMES, setSessionCookies } from "./auth.tokens.js";

type AdminLike = { _id: unknown; email: string; name?: string | null; avatar?: string | null };

const toPublicAdmin = (admin: AdminLike) => ({
  id: String(admin._id),
  email: admin.email,
  name: admin.name ?? null,
  avatar: admin.avatar ?? null,
});

const refreshCookie = (req: Request): string | undefined => {
  const value: unknown = req.cookies?.[COOKIE_NAMES.refresh];
  return typeof value === "string" ? value : undefined;
};

export async function googleLogin(req: Request, res: Response) {
  const { admin, accessToken, refreshToken } = await authService.loginWithGoogle(
    req,
    req.body.credential,
  );
  setSessionCookies(res, { accessToken, refreshToken });
  sendSuccess(res, { admin: toPublicAdmin(admin) });
}

export async function refresh(req: Request, res: Response) {
  try {
    const session = await authService.refreshSession(req, refreshCookie(req));
    setSessionCookies(res, session);
    sendSuccess(res, { admin: toPublicAdmin(session.admin) });
  } catch (err) {
    clearSessionCookies(res);
    throw err;
  }
}

export async function logout(req: Request, res: Response) {
  await authService.logout(req, refreshCookie(req));
  clearSessionCookies(res);
  sendSuccess(res, { loggedOut: true });
}

export async function me(req: Request, res: Response) {
  const admin = await Admin.findById(req.admin!.id).lean();
  if (!admin) throw notFound("Admin not found");
  sendSuccess(res, { admin: toPublicAdmin(admin) });
}
