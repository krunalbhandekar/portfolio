import { getSearchIndex, getVisiblePages } from "@/lib/data/public";
import type { SearchItem } from "@/lib/data/types";

const PAGE_TITLES: Record<string, string> = { now: "Now", uses: "Uses", faq: "FAQ" };

/**
 * ⌘K palette index, served by Next (not Render): prerendered and revalidated by content tags,
 * so search is instant even while the API is asleep.
 */
export async function GET() {
  const [items, pages] = await Promise.all([getSearchIndex(), getVisiblePages()]);
  const extra: SearchItem[] = pages.map((key) => ({
    type: "page",
    title: PAGE_TITLES[key] ?? key,
    subtitle: "Page",
    href: `/${key}`,
    keywords: key,
  }));
  return Response.json([...extra, ...items]);
}
