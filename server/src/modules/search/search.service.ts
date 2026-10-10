import { CaseStudy } from "../case-studies/case-study.model.js";
import { EngineeringItem } from "../engineering/engineering.model.js";
import { Post } from "../posts/post.model.js";
import { featuredFirst, getFeaturedIds } from "../projects/featured.js";
import { Project } from "../projects/project.model.js";
import { Skill } from "../skills/skill.model.js";

const PUBLISHED = { status: "published" } as const;

export type SearchItem = {
  type: "project" | "case-study" | "skill" | "post" | "engineering";
  title: string;
  /** Short context line shown under the title. */
  subtitle: string;
  href: string;
  /** Extra words that should match (technologies, tags…), never shown. */
  keywords: string;
};

const ENGINEERING_LABELS: Record<string, string> = {
  architecture: "Architecture",
  api: "API",
  database: "Database design",
  devops: "DevOps",
  decision: "Engineering decision",
};

/**
 * Every published item the ⌘K palette can jump to. Small (titles + a line of context), so the
 * client caches it and filters instantly — search keeps working while the API sleeps.
 */
export async function getSearchIndex(): Promise<SearchItem[]> {
  const [allProjects, studies, skills, posts, engineering, featured] = await Promise.all([
    Project.find(PUBLISHED, { title: 1, slug: 1, summary: 1, technologies: 1, category: 1 })
      .sort({ order: 1 })
      .lean(),
    CaseStudy.find(PUBLISHED, { title: 1, slug: 1, summary: 1 }).sort({ order: 1 }).lean(),
    Skill.find(PUBLISHED, { name: 1, slug: 1, category: 1 }).sort({ order: 1 }).lean(),
    Post.find(PUBLISHED, { title: 1, slug: 1, excerpt: 1, tags: 1, category: 1 })
      .sort({ publishedAt: -1 })
      .lean(),
    EngineeringItem.find(PUBLISHED, { title: 1, slug: 1, type: 1, summary: 1 })
      .sort({ order: 1 })
      .lean(),
    getFeaturedIds(),
  ]);
  const projects = featuredFirst(allProjects, featured);
  const line = (value: unknown) => String(value ?? "").slice(0, 120);
  return [
    ...projects.map((p) => ({
      type: "project" as const,
      title: p.title,
      subtitle: line(p.summary),
      href: `/projects/${p.slug}`,
      keywords: [...(p.technologies ?? []), p.category ?? ""].join(" "),
    })),
    ...studies.map((c) => ({
      type: "case-study" as const,
      title: c.title,
      subtitle: line(c.summary),
      href: `/case-studies/${c.slug}`,
      keywords: "",
    })),
    ...posts.map((p) => ({
      type: "post" as const,
      title: p.title,
      subtitle: line(p.excerpt),
      href: `/blog/${p.slug}`,
      keywords: [...(p.tags ?? []), p.category ?? ""].join(" "),
    })),
    ...skills.map((s) => ({
      type: "skill" as const,
      title: s.name,
      subtitle: `Skill · ${s.category ?? ""}`,
      href: `/skills/${s.slug}`,
      keywords: s.slug,
    })),
    ...engineering.map((e) => ({
      type: "engineering" as const,
      title: e.title,
      subtitle: ENGINEERING_LABELS[String(e.type)] ?? "Engineering",
      href: `/engineering#${e.slug}`,
      keywords: line(e.summary),
    })),
  ];
}

/** `GET /search?q=`: same index, filtered server-side (every word must match somewhere). */
export async function search(q: string, limit = 20) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const index = await getSearchIndex();
  return index
    .map((item) => {
      const title = item.title.toLowerCase();
      const haystack = `${title} ${item.subtitle} ${item.keywords}`.toLowerCase();
      if (!words.every((w) => haystack.includes(w))) return null;
      const score =
        (title.startsWith(words[0]!) ? 3 : 0) + words.filter((w) => title.includes(w)).length;
      return { item, score };
    })
    .filter((r): r is { item: SearchItem; score: number } => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);
}
