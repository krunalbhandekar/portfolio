import { getFeedPosts, getSettings } from "@/lib/data/public";
import { absoluteUrl } from "@/lib/seo";

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
const cdata = (value: string) => `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;

/** RSS 2.0 feed of published posts (portfolio.md §3.15), revalidated with the "posts" tag. */
export async function GET() {
  const [posts, settings] = await Promise.all([getFeedPosts(), getSettings()]);
  const blog = absoluteUrl("/blog");
  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`);
      const date = post.publishedAt ?? post.updatedAt;
      return `    <item>
      <title>${escape(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      ${date ? `<pubDate>${new Date(date).toUTCString()}</pubDate>` : ""}
      <description>${escape(post.excerpt ?? "")}</description>
      ${post.category ? `<category>${escape(post.category)}</category>` : ""}
      ${(post.tags ?? []).map((t) => `<category>${escape(t)}</category>`).join("")}
      <content:encoded>${cdata(post.content ?? "")}</content:encoded>
    </item>`;
    })
    .join("\n");
  const latest = posts[0]?.publishedAt ?? posts[0]?.updatedAt;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escape(`${settings.name} — Blog`)}</title>
    <link>${blog}</link>
    <description>${escape(`Technical articles by ${settings.name}, ${settings.role}.`)}</description>
    <language>en</language>
    <atom:link href="${absoluteUrl("/rss.xml")}" rel="self" type="application/rss+xml" />
    ${latest ? `<lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
