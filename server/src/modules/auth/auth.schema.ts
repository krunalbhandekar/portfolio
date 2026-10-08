import { z } from "zod";

export const googleLoginSchema = z.object({
  /** Google Identity Services ID token (JWT) from the "Sign in with Google" button. */
  credential: z.string().min(100).max(4096),
});
