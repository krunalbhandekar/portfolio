import type { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/data/public";
import { absoluteUrl } from "@/lib/seo";

/** Generated from the CMS (portfolio.md §8.1); refreshed whenever content is revalidated. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getSitemapData();
  const at = (value?: string | null) => (value ? new Date(value) : undefined);
  const latestProject = data.projects.reduce<string | null>(
    (latest, p) => (!latest || p.updatedAt > latest ? p.updatedAt : latest),
    null,
  );

  return [
    {
      url: absoluteUrl("/"),
      lastModified: at(data.updatedAt.settings),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/projects"),
      lastModified: at(latestProject),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...data.projects.map((p) => ({
      url: absoluteUrl(`/projects/${p.slug}`),
      lastModified: at(p.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: absoluteUrl("/experience"),
      lastModified: at(data.updatedAt.experiences),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/skills"),
      lastModified: at(data.updatedAt.skills),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: at(data.updatedAt.about),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: absoluteUrl("/resume"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.5 },
  ];
}
