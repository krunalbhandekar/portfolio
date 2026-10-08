import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const bodySchema = z.object({
  paths: z.array(z.string().startsWith("/").max(512)).max(100).default([]),
  tags: z.array(z.string().min(1).max(256)).max(100).default([]),
});

function isAuthorized(provided: string | null) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * On-demand revalidation, called by the Express server after admin writes (portfolio.md §10).
 * Uses `expire: 0` so the next visitor gets the edited content instead of a stale copy.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request.headers.get("x-revalidate-secret"))) {
    return Response.json(
      { success: false, data: null, error: { code: "UNAUTHORIZED", message: "Invalid secret" } },
      { status: 401 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { success: false, data: null, error: { code: "VALIDATION_ERROR", message: "Invalid body" } },
      { status: 400 },
    );
  }

  const { paths, tags } = parsed.data;
  for (const path of paths) revalidatePath(path);
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return Response.json({ success: true, data: { paths, tags }, error: null });
}
