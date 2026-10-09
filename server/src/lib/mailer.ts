import { env } from "../config/env.js";
import { logger } from "./logger.js";

/**
 * Resend's shared sender: works without a verified domain, but only delivers to the Resend
 * account owner's address (fine here: every email goes to ADMIN_EMAIL). With your own domain
 * verified in Resend, change this to e.g. "Portfolio <notify@yourdomain.dev>".
 */

type AdminEmail = { subject: string; text: string; replyTo?: string };

/**
 * Emails the site owner (`ADMIN_EMAIL`) via Resend's HTTP API. Never throws: callers
 * have already stored whatever triggered the email. Returns whether it was sent.
 */
export async function sendAdminEmail({ subject, text, replyTo }: AdminEmail) {
  if (!env.RESEND_API_KEY) {
    logger.warn({ subject }, "RESEND_API_KEY not set; notification email not sent");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Portfolio <onboarding@resend.dev>",
        to: [env.ADMIN_EMAIL],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok)
      throw new Error(`Resend responded ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return true;
  } catch (err) {
    logger.error({ err, subject }, "Failed to send notification email");
    return false;
  }
}
