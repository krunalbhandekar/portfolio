import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

type RevalidateInput = { paths?: string[]; tags?: string[] };

/**
 * Asks the Next.js client to refresh cached pages after content changes (on-demand ISR).
 * Called after admin writes from Phase 3 on. Failures are logged, not thrown: the write
 * itself succeeded, and pages fall back to their normal cache lifetime.
 */
export async function revalidate({ paths = [], tags = [] }: RevalidateInput) {
  if (paths.length === 0 && tags.length === 0) return true;
  try {
    const res = await fetch(new URL("/api/revalidate", env.CLIENT_URL), {
      method: "POST",
      headers: { "content-type": "application/json", "x-revalidate-secret": env.REVALIDATE_SECRET },
      body: JSON.stringify({ paths, tags }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Revalidate responded ${res.status}`);
    return true;
  } catch (err) {
    logger.warn({ err, paths, tags }, "Revalidation failed");
    return false;
  }
}
