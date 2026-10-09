import { cacheLife, cacheTag } from "next/cache";
import { draftMode } from "next/headers";
import type { FlowData } from "@/components/diagrams/flow-layout";
import { siteConfig } from "@/config/site";
import type {
  About,
  FeedPost,
  GithubData,
  Post,
  PostCard,
  PostList,
  SearchItem,
  SkillDetail,
  Achievement,
  BuiltFeature,
  CaseStudy,
  CaseStudyCard,
  Certification,
  EngineeringItem,
  Testimonial,
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

async function fetchPublic<T>(
  path: string,
  headers: Record<string, string> = {},
): Promise<Fetched<T | null>> {
  try {
    const res = await fetch(`${API_URL}/api/v1${path}`, {
      headers: { Accept: "application/json", ...headers },
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

/**
 * Draft Mode (portfolio.md §5.3): when the admin previews, read from the secret-protected
 * preview endpoint, which also returns unpublished documents. `draftMode()` is readable inside
 * `use cache`, and Draft Mode bypasses the cache, so visitors never see preview data.
 */
async function draftAware(
  publicPath: string,
  previewPath: string,
): Promise<{ path: string; headers: Record<string, string> }> {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return { path: publicPath, headers: {} };
  return {
    path: previewPath,
    headers: { "x-preview-secret": process.env.REVALIDATE_SECRET ?? "" },
  };
}

const normalizeFlow = (flow: Partial<FlowData> | null | undefined): FlowData => ({
  nodes: arr(flow?.nodes),
  edges: arr(flow?.edges),
});

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
      flow: normalizeFlow(p.architecture?.flow),
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
    caseStudy: p.caseStudy ?? null,
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
  recruiter: {
    experience: "",
    targetRoles: "",
    noticePeriod: "",
    workPreference: "",
    preferredLocations: "",
    relocation: "",
    workAuthorization: "",
    note: "",
  },
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
    recruiter: { ...fallbackSettings.recruiter, ...settings.recruiter },
  };
}

export async function getHome(): Promise<HomeData> {
  "use cache";
  cacheTag(
    "homepage",
    "projects",
    "experiences",
    "skills",
    "about",
    "case-studies",
    "testimonials",
    "posts",
  );
  const home = settle(await fetchPublic<HomeData>("/home"), {
    homepage: { sections: [] },
    featuredProjects: [],
    experiences: [],
    skills: [],
    about: null,
    caseStudies: [],
    testimonials: [],
    posts: [],
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
    caseStudies: arr(home.caseStudies),
    testimonials: arr(home.testimonials),
    posts: arr(home.posts).map(normalizePostCard),
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
  cacheTag("projects", `project:${slug}`, "experiences", "case-studies");
  const source = await draftAware(
    `/projects/${encodeURIComponent(slug)}`,
    `/preview/projects/${encodeURIComponent(slug)}`,
  );
  const project = settle(await fetchPublic<ProjectDetail>(source.path, source.headers), null);
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
  cacheTag(
    "projects",
    "settings",
    "about",
    "experiences",
    "skills",
    "case-studies",
    "engineering",
    "built",
    "posts",
    "github",
  );
  const data = settle(await fetchPublic<SitemapData>("/sitemap-data"), {
    projects: [],
    caseStudies: [],
    posts: [],
    skills: [],
    updatedAt: {},
  });
  return {
    ...data,
    caseStudies: arr(data.caseStudies),
    posts: arr(data.posts),
    skills: arr(data.skills),
  };
}

/** Skill slug → display name, for tech chips stored as slugs. */
export function skillNames(skills: { slug: string; name: string }[]) {
  return new Map(skills.map((s) => [s.slug, s.name]));
}

/* ---------------------------------------------------------------- Phase 5 content */

export async function getCaseStudies(): Promise<CaseStudyCard[]> {
  "use cache";
  cacheTag("case-studies", "projects");
  return arr(settle(await fetchPublic<CaseStudyCard[]>("/case-studies"), []));
}

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  "use cache";
  cacheTag("case-studies", `case-study:${slug}`, "projects");
  const source = await draftAware(
    `/case-studies/${encodeURIComponent(slug)}`,
    `/preview/case-studies/${encodeURIComponent(slug)}`,
  );
  const study = settle(await fetchPublic<CaseStudy>(source.path, source.headers), null);
  if (!study) return null;
  return {
    ...study,
    sections: arr(study.sections),
    seo: {
      title: study.seo?.title ?? "",
      description: study.seo?.description ?? "",
      noindex: study.seo?.noindex ?? false,
    },
    project: study.project ? normalizeCard(study.project) : null,
    more: arr(study.more),
  };
}

export async function getEngineering(): Promise<EngineeringItem[]> {
  "use cache";
  cacheTag("engineering", "projects");
  return arr(settle(await fetchPublic<EngineeringItem[]>("/engineering"), [])).map((item) => ({
    ...item,
    summary: item.summary ?? "",
    content: item.content ?? "",
    diagram: item.diagram ?? "",
    flow: normalizeFlow(item.flow),
    api: {
      method: item.api?.method ?? "GET",
      path: item.api?.path ?? "",
      auth: item.api?.auth ?? "none",
      params: arr(item.api?.params),
      requestExample: item.api?.requestExample ?? "",
      responseExample: item.api?.responseExample ?? "",
      statusCodes: arr(item.api?.statusCodes),
    },
  }));
}

export async function getBuiltFeatures(): Promise<BuiltFeature[]> {
  "use cache";
  cacheTag("built", "projects", "case-studies");
  return arr(settle(await fetchPublic<BuiltFeature[]>("/built-features"), [])).map((f) => ({
    ...f,
    technologies: arr(f.technologies),
  }));
}

export async function getTestimonials(): Promise<Testimonial[]> {
  "use cache";
  cacheTag("testimonials");
  return arr(settle(await fetchPublic<Testimonial[]>("/testimonials"), []));
}

export async function getAchievements(): Promise<Achievement[]> {
  "use cache";
  cacheTag("achievements", "projects");
  return arr(settle(await fetchPublic<Achievement[]>("/achievements"), []));
}

export async function getCertifications(): Promise<Certification[]> {
  "use cache";
  cacheTag("certifications");
  return arr(settle(await fetchPublic<Certification[]>("/certifications"), []));
}

/* ---------------------------------------------------------------- Phase 6 */

function normalizePostCard<T extends PostCard>(p: T): T {
  return {
    ...p,
    excerpt: p.excerpt ?? "",
    category: p.category ?? "",
    tags: arr(p.tags),
    coverImage: p.coverImage ?? null,
    readingTime: p.readingTime ?? 1,
    publishedAt: p.publishedAt ?? null,
  };
}

/** Every published post (small blog: the list page filters by tag/search on the client). */
export async function getPosts(): Promise<PostList> {
  "use cache";
  cacheTag("posts");
  const data = settle(await fetchPublic<PostList>("/posts?limit=100"), { items: [], tags: [] });
  return { items: arr(data.items).map(normalizePostCard), tags: arr(data.tags) };
}

export async function getPost(slug: string): Promise<Post | null> {
  "use cache";
  cacheTag("posts", `post:${slug}`);
  const source = await draftAware(
    `/posts/${encodeURIComponent(slug)}`,
    `/preview/posts/${encodeURIComponent(slug)}`,
  );
  const post = settle(await fetchPublic<Post>(source.path, source.headers), null);
  if (!post) return null;
  return {
    ...normalizePostCard(post),
    content: post.content ?? "",
    crossPostUrl: post.crossPostUrl ?? "",
    seo: {
      title: post.seo?.title ?? "",
      description: post.seo?.description ?? "",
      noindex: post.seo?.noindex ?? false,
    },
    related: arr(post.related).map(normalizePostCard),
  };
}

export async function getFeedPosts(): Promise<FeedPost[]> {
  "use cache";
  cacheTag("posts");
  return arr(settle(await fetchPublic<FeedPost[]>("/feed"), []));
}

export async function getSkill(slug: string): Promise<SkillDetail | null> {
  "use cache";
  cacheTag("skills", `skill:${slug}`, "projects", "posts", "built", "experiences");
  const skill = settle(await fetchPublic<SkillDetail>(`/skills/${encodeURIComponent(slug)}`), null);
  if (!skill) return null;
  return {
    ...skill,
    levelLabel: skill.levelLabel ?? "",
    years: skill.years ?? null,
    projects: arr(skill.projects).map(normalizeCard),
    features: arr(skill.features),
    experiences: arr(skill.experiences),
    posts: arr(skill.posts).map(normalizePostCard),
  };
}

export async function getGithub(): Promise<GithubData | null> {
  "use cache";
  cacheTag("github");
  const data = settle(await fetchPublic<GithubData>("/github"), null);
  if (!data) return null;
  return {
    ...data,
    pinned: arr(data.pinned).map((r) => ({ ...r, topics: arr(r.topics) })),
    languages: arr(data.languages),
    pullRequests: arr(data.pullRequests),
  };
}

/** ⌘K palette index (titles + context of every published item). */
export async function getSearchIndex(): Promise<SearchItem[]> {
  "use cache";
  cacheTag("projects", "case-studies", "skills", "posts", "engineering");
  return arr(settle(await fetchPublic<SearchItem[]>("/search-index"), []));
}

/** All published resume versions (role-tailored links, /hire). */
export async function getResumes(): Promise<(Resume & { isDefault: boolean })[]> {
  "use cache";
  cacheTag("resumes");
  return arr(settle(await fetchPublic<(Resume & { isDefault: boolean })[]>("/resumes"), []));
}
