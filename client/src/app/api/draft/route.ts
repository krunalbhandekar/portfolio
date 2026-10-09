import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = (process.env.API_URL ?? "http://localhost:5050").replace(/\/+$/, "");

/**
 * Enters Draft Mode (portfolio.md §5.3). Opened from the admin's "Preview" button; only the
 * signed-in admin can enable it: the request's own auth cookie is verified with the API.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path") ?? "/";
  // Same-site paths only (no open redirects).
  if (!path.startsWith("/") || path.startsWith("//")) {
    return new Response("Invalid preview path", { status: 400 });
  }

  const res = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: { cookie: request.headers.get("cookie") ?? "", accept: "application/json" },
    signal: AbortSignal.timeout(60_000),
  }).catch(() => null);
  if (!res?.ok) {
    return new Response("Preview is only available to the signed-in admin.", { status: 401 });
  }

  (await draftMode()).enable();
  redirect(path);
}
