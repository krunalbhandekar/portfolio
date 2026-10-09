import { getRedirects } from "@/lib/data/public";

/** Redirect map for `proxy.ts`: prerendered and revalidated with the "redirects" tag. */
export async function GET() {
  return Response.json(await getRedirects());
}
