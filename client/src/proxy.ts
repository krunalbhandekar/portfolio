import { NextResponse, type NextRequest } from "next/server";

type Rule = { from: string; to: string; statusCode: number };

/**
 * DB-driven redirects (portfolio.md §4 #14): old URLs (e.g. a renamed project slug) answer
 * with a real 301 before any page renders. The map comes from this site's own cached
 * `/api/redirects` route (CDN, revalidated on change), kept in memory for a minute, so a
 * lookup never waits for the API server.
 */
const TTL_MS = 60_000;
let cache: { at: number; rules: Map<string, Rule> } | null = null;
let pending: Promise<Map<string, Rule>> | null = null;

async function load(origin: string): Promise<Map<string, Rule>> {
  try {
    const res = await fetch(`${origin}/api/redirects`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error(String(res.status));
    const rules = (await res.json()) as Rule[];
    cache = { at: Date.now(), rules: new Map(rules.map((r) => [r.from, r])) };
  } catch {
    // Keep serving the previous map (or none) rather than failing the page.
    cache = { at: Date.now(), rules: cache?.rules ?? new Map() };
  }
  return cache.rules;
}

async function rules(origin: string) {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rules;
  pending ??= load(origin).finally(() => {
    pending = null;
  });
  return pending;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const rule = (await rules(request.nextUrl.origin)).get(path);
  if (!rule) return NextResponse.next();
  // Same-site paths keep the query string; never treat "//host" as a path.
  const isPath = rule.to.startsWith("/") && !rule.to.startsWith("//");
  if (!isPath && !rule.to.startsWith("https://")) return NextResponse.next();
  const target = isPath ? new URL(rule.to + search, request.url) : rule.to;
  return NextResponse.redirect(target, rule.statusCode);
}

export const config = {
  // Pages only: never the API, admin, Next internals, or files with an extension.
  matcher: ["/((?!api|admin|_next|_vercel|.*\\.[\\w]+$).*)"],
};
