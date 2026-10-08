import { z } from "zod";

// Optional now; each becomes required in the phase that starts using it (see portfolio.md §6.5).
const laterPhase = z.string().min(1).optional();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.url(),

  // Phase 2 — database & auth
  MONGODB_URI: laterPhase,
  COOKIE_DOMAIN: laterPhase,
  GOOGLE_CLIENT_ID: laterPhase,
  ADMIN_EMAIL: z.email().default("krunalbhandekar10@gmail.com"),
  JWT_ACCESS_SECRET: laterPhase,
  JWT_REFRESH_SECRET: laterPhase,
  REVALIDATE_SECRET: laterPhase,

  // Phase 3 — media (format: cloudinary://<api_key>:<api_secret>@<cloud_name>, read natively by the SDK)
  CLOUDINARY_URL: z
    .string()
    .regex(
      /^cloudinary:\/\/[^:]+:[^@]+@.+$/,
      "Expected cloudinary://<api_key>:<api_secret>@<cloud_name>",
    )
    .optional(),

  // Phase 4 — contact & monitoring
  RESEND_API_KEY: laterPhase,
  CONTACT_NOTIFY_EMAIL: z.email().default("krunalbhandekar10@gmail.com"),
  TURNSTILE_SECRET_KEY: laterPhase,
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
