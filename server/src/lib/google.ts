import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google Identity Services ID token (signature, audience, expiry) and returns its
 * payload, or `null` if it isn't valid. Used by admin sign-in and visitor testimonials.
 */
export async function verifyGoogleIdToken(credential: string): Promise<TokenPayload | null> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload() ?? null;
  } catch (err) {
    // google-auth-library can include the raw ID token in its messages: redact JWT-like strings.
    const reason =
      err instanceof Error
        ? err.message.replace(/[\w-]+\.[\w-]+\.[\w-]+/g, "[token]").slice(0, 300)
        : "unknown";
    logger.warn({ reason }, "Google token verification failed");
    return null;
  }
}
