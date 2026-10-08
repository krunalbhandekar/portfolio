import { cacheLife, cacheTag } from "next/cache";
import { siteConfig } from "@/config/site";
import type {
  About,
  Capability,
  Experience,
  HomeData,
  ProjectCard,
  ProjectDetail,
  Resume,
  Settings,
  SitemapData,
  Skill,
} from "./types";

/*
 * Server-side data access for public pages (portfolio.md §1 rendering strategy).
 *
 * - Every function is `use cache` + `cacheTag(...)` with the same tags the API revalidates on
 *   admin writes, so edits go live in seconds without a redeploy.
 * - Successful responses are cached indefinitely (`max`); revalidation is on demand.
 * - If the API is unreachable (Render asleep, outage, build machine offline) we serve
 *   fallback data cached for only a few minutes, so builds never fail and the site heals
 *   itself without waiting for the next admin edit.
 */

const API_URL = (process.env.API_URL ?? "http://localhost:5050").replace(/\/+$/, "");
const TIMEOUT_MS = 20_000;

type Fetched<T> = { ok: true; data: T } | { ok: false };

async function fetchPublic<T>(path: string): Promise<Fetched<T | null>> {
  try {
    const res = await fetch(`${API_URL}/api/v1${path}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 404) return { ok: true, data: null };
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { data: T };
    return { ok: true, data: body.data };
  } catch (error) {
    console.warn(`[data] ${path} unavailable, serving fallback:`, (error as Error).message);
    return { ok: false };
  }
}

/** Applies the cache lifetime for the outcome and returns the data (or the fallback). */
function settle<T>(result: Fetched<T | null>, fallback: T): T {
  if (!result.ok) {
    cacheLife("minutes");
    return fallback;
  }
  cacheLife("max");
  return result.data ?? fallback;
}

/*
 * Normalisers: documents saved through the admin always have every field, but older documents
 * (or fields added in later phases) may not. Pages can rely on arrays/objects being present.
 */
const arr = <T>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);

function normalizeCard<T extends ProjectCard>(p: T): T {
  return { ...p, technologies: arr(p.technologies), thumbnail: p.thumbnail ?? null };
}

function normalizeProject(p: ProjectDetail): ProjectDetail {
  return {
    ...normalizeCard(p),
    role: p.role ?? "",
    duration: p.duration ?? "",
    teamSize: p.teamSize ?? null,
    gallery: arr(p.gallery),
    videoUrl: p.videoUrl ?? "",
    liveUrl: p.liveUrl ?? "",
    repoUrl: p.repoUrl ?? "",
    demoCredentials: p.demoCredentials ?? null,
    problem: p.problem ?? "",
    solution: p.solution ?? "",
    contributions: arr(p.contributions),
    features: arr(p.features),
    architecture: {
      description: p.architecture?.description ?? "",
      diagram: p.architecture?.diagram ?? "",
      image: p.architecture?.image ?? null,
    },
    challenges: arr(p.challenges),
    decisions: arr(p.decisions),
    metrics: arr(p.metrics),
    seo: {
      title: p.seo?.title ?? "",
      description: p.seo?.description ?? "",
      noindex: p.seo?.noindex ?? false,
    },
    experience: p.experience ?? null,
    related: arr(p.related).map(normalizeCard),
    previous: p.previous ?? null,
    next: p.next ?? null,
  };
}

function normalizeExperience(e: Experience): Experience {
  return {
    ...e,
    companyUrl: e.companyUrl ?? "",
    companyLogo: e.companyLogo ?? null,
    summary: e.summary ?? "",
    technologies: arr(e.technologies),
    responsibilities: arr(e.responsibilities),
    achievements: arr(e.achievements),
    projects: arr(e.projects),
  };
}

function normalizeAbout(a: About): About {
  return {
    headline: a.headline ?? "",
    story: a.story ?? "",
    portrait: a.portrait ?? null,
    education: arr(a.education),
    journey: arr(a.journey),
    values: arr(a.values),
    domains: arr(a.domains),
  };
}

export const fallbackSettings: Settings = {
  name: siteConfig.name,
  role: siteConfig.role,
  tagline: "",
  location: siteConfig.location,
  email: siteConfig.email,
  phone: "",
  availabilityText: siteConfig.availability,
  accentColor: "",
  socials: siteConfig.socials.map((s) => ({ platform: s.icon, label: s.label, url: s.href })),
  announcement: { enabled: false, text: "", href: "" },
  calendarUrl: "",
  avatar: null,
  logo: null,
  seo: { title: "", description: "", ogImage: null },
};

export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheTag("settings");
  const result = await fetchPublic<Settings>("/settings");
  const settings = settle(result, fallbackSettings);
  return {
    ...fallbackSettings,
    ...settings,
    availabilityText: settings.availabilityText ?? "",
  };
}

export async function getHome(): Promise<HomeData> {
  "use cache";
  cacheTag("homepage", "projects", "experiences", "skills", "about");
  const home = settle(await fetchPublic<HomeData>("/home"), {
    homepage: { sections: [] },
    featuredProjects: [],
    experiences: [],
    skills: [],
    about: null,
  });
  return {
    homepage: { ...home.homepage, sections: arr(home.homepage?.sections) },
    featuredProjects: arr(home.featuredProjects).map(normalizeCard),
    experiences: arr(home.experiences),
    skills: arr(home.skills),
    about: home.about
      ? {
          headline: home.about.headline ?? "",
          story: home.about.story ?? "",
          portrait: home.about.portrait ?? null,
        }
      : null,
  };
}

export async function getAbout(): Promise<About | null> {
  "use cache";
  cacheTag("about");
  const about = settle(await fetchPublic<About>("/about"), null);
  return about ? normalizeAbout(about) : null;
}

export async function getExperiences(): Promise<Experience[]> {
  "use cache";
  cacheTag("experiences", "projects");
  return arr(settle(await fetchPublic<Experience[]>("/experiences"), [])).map(normalizeExperience);
}

export async function getProjects(): Promise<ProjectCard[]> {
  "use cache";
  cacheTag("projects");
  return arr(settle(await fetchPublic<ProjectCard[]>("/projects"), [])).map(normalizeCard);
}

export async function getProject(slug: string): Promise<ProjectDetail | null> {
  "use cache";
  cacheTag("projects", `project:${slug}`, "experiences");
  const project = settle(
    await fetchPublic<ProjectDetail>(`/projects/${encodeURIComponent(slug)}`),
    null,
  );
  return project ? normalizeProject(project) : null;
}

export async function getSkills(): Promise<{ skills: Skill[]; capabilities: Capability[] }> {
  "use cache";
  cacheTag("skills", "projects");
  const data = settle(
    await fetchPublic<{ skills: Skill[]; capabilities: Capability[] }>("/skills"),
    {
      skills: [],
      capabilities: [],
    },
  );
  return {
    skills: arr(data.skills).map((s) => ({ ...s, projects: arr(s.projects) })),
    capabilities: arr(data.capabilities).map((c) => ({
      ...c,
      relatedSkills: arr(c.relatedSkills),
    })),
  };
}

export async function getResume(): Promise<Resume | null> {
  "use cache";
  cacheTag("resumes");
  return settle(await fetchPublic<Resume>("/resume"), null);
}

export async function getSitemapData(): Promise<SitemapData> {
  "use cache";
  cacheTag("projects", "settings", "about", "experiences", "skills");
  return settle(await fetchPublic<SitemapData>("/sitemap-data"), { projects: [], updatedAt: {} });
}

/** Skill slug → display name, for tech chips stored as slugs. */
export function skillNames(skills: { slug: string; name: string }[]) {
  return new Map(skills.map((s) => [s.slug, s.name]));
}
