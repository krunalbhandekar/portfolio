import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/dev"] }],
    // The sitemap itself ships in Phase 4.
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
