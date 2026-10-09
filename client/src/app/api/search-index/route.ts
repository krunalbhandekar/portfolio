import { getSearchIndex } from "@/lib/data/public";

/**
 * ⌘K palette index, served by Next (not Render): prerendered and revalidated by content tags,
 * so search is instant even while the API is asleep.
 */
export async function GET() {
  return Response.json(await getSearchIndex());
}
