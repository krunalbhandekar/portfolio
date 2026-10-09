import { z } from "zod";

// Optional now; each becomes required in the phase that starts using it (see portfolio.md §6.5).
const laterPhase = z.string().min(1).optional();
const secret = z.string().min(32, "Use at least 32 characters (e.g. `openssl rand -hex 32`)");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5050),
  CLIENT_URL: z.url(),
  /** Extra allowed CORS origins, comma-separated (e.g. a Vercel preview URL). */
  CORS_ORIGINS: z.string().optional(),
  /** Number of proxies in front of the app (Render = 1). Used for client IPs in logs/rate limits. */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),

  // Phase 2 — database & auth
  MONGODB_URI: z
    .string()
    .regex(/^mongodb(\+srv)?:\/\//, "Expected a mongodb:// or mongodb+srv:// URI"),
  /** Leave unset when the client proxies /api/v1 (cookies stay host-only on the client domain). */
  COOKIE_DOMAIN: laterPhase,
  GOOGLE_CLIENT_ID: z.string().endsWith(".apps.googleusercontent.com"),
  /** The only account allowed into the admin; also receives notification emails. */
  ADMIN_EMAIL: z.email().default("krunalbhandekar10@gmail.com"),
  JWT_ACCESS_SECRET: secret,
  /** HMAC key used to hash refresh tokens before they are stored. */
  JWT_REFRESH_SECRET: secret,
  REVALIDATE_SECRET: secret,

  // Phase 3 — media (format: cloudinary://<api_key>:<api_secret>@<cloud_name>, read natively by the SDK)
  CLOUDINARY_URL: z
    .string()
    .regex(
      /^cloudinary:\/\/[^:]+:[^@]+@.+$/,
      "Expected cloudinary://<api_key>:<api_secret>@<cloud_name>",
    ),

  // Phase 4 — contact & monitoring
  RESEND_API_KEY: laterPhase,
  /** Sender for notification emails. onboarding@resend.dev works without a verified domain,
   *  but can only deliver to the Resend account owner's address. */
  RESEND_FROM: z.string().default("Portfolio <onboarding@resend.dev>"),
  SENTRY_DSN: laterPhase,

  // Phase 6 — GitHub & scheduled jobs
  GITHUB_TOKEN: laterPhase,
  JOBS_SECRET: laterPhase,
});

// Treat blank values (e.g. `KEY=` copied from .env.example) as unset.
const rawEnv = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== undefined && value.trim() !== ""),
);

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

export const isProduction = env.NODE_ENV === "production";

export const corsOrigins = [
  env.CLIENT_URL,
  ...(env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()) ?? []),
].filter(Boolean);
