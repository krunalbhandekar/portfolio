import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { revalidate } from "../../services/revalidate.js";
import { GithubCache, GithubConfig } from "./github.model.js";

const API = "https://api.github.com";
/** Repos whose languages are summed (each costs one request; unauthenticated limit is 60/h). */
const LANGUAGE_REPOS = 20;

/** GitHub's own colours for common languages; others fall back to grey. */
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  PHP: "#4F5D95",
  Ruby: "#701516",
  "C#": "#178600",
  "C++": "#f34b7d",
  C: "#555555",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Dart: "#00B4AB",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  "Jupyter Notebook": "#DA5B0B",
};

class GithubError extends Error {}

async function gh<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "krunal-portfolio",
      ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
      ...init.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 404) throw new GithubError("GitHub user or repository not found");
  if (res.status === 403 || res.status === 429) {
    const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000;
    throw new GithubError(
      `GitHub rate limit reached${reset ? ` (resets ${new Date(reset).toISOString()})` : ""}. ${
        env.GITHUB_TOKEN ? "" : "Add GITHUB_TOKEN on the server for a much higher limit."
      }`.trim(),
    );
  }
  if (res.status === 401) throw new GithubError("GITHUB_TOKEN is invalid or expired");
  if (!res.ok) throw new GithubError(`GitHub responded ${res.status}`);
  return (await res.json()) as T;
}

type RepoJson = {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics?: string[];
  fork: boolean;
  archived: boolean;
  pushed_at: string;
};

/** Contribution calendar: GraphQL only, so it needs a token. */
async function fetchContributions(username: string) {
  if (!env.GITHUB_TOKEN) return null;
  const query = `query($login: String!) { user(login: $login) { contributionsCollection {
    contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } }
  } } }`;
  const levels: Record<string, number> = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4,
  };
  type Calendar = {
    totalContributions: number;
    weeks: {
      contributionDays: { date: string; contributionCount: number; contributionLevel: string }[];
    }[];
  };
  const body = await gh<{
    data?: { user: { contributionsCollection: { contributionCalendar: Calendar } } | null };
    errors?: { message: string }[];
  }>("/graphql", {
    method: "POST",
    body: JSON.stringify({ query, variables: { login: username } }),
    headers: { "Content-Type": "application/json" },
  });
  if (body.errors?.length) throw new GithubError(body.errors[0]!.message);
  const calendar = body.data?.user?.contributionsCollection.contributionCalendar;
  if (!calendar) return null;
  return {
    total: calendar.totalContributions,
    weeks: calendar.weeks.map((w) => ({
      days: w.contributionDays.map((d) => ({
        date: d.date,
        count: d.contributionCount,
        level: levels[d.contributionLevel] ?? 0,
      })),
    })),
  };
}

/**
 * Fetches profile, repos, language breakdown, contribution calendar and merged PRs to other
 * people's repos, then replaces the cache. On failure the previous data is kept.
 */
export async function syncGithub() {
  const config = await GithubConfig.findOne({ key: "default" }).lean();
  const username = config?.username?.trim();
  if (!username) return { synced: false, reason: "No GitHub username set" };

  try {
    const [user, repos] = await Promise.all([
      gh<{
        name: string | null;
        avatar_url: string;
        html_url: string;
        bio: string | null;
        public_repos: number;
        followers: number;
      }>(`/users/${encodeURIComponent(username)}`),
      gh<RepoJson[]>(
        `/users/${encodeURIComponent(username)}/repos?type=owner&sort=pushed&per_page=100`,
      ),
    ]);

    // Language bytes across the most recently active own (non-fork) repos.
    const sources = repos.filter((r) => !r.fork && !r.archived).slice(0, LANGUAGE_REPOS);
    const perRepo = await Promise.all(
      sources.map((r) =>
        gh<Record<string, number>>(`/repos/${r.full_name}/languages`).catch(() => ({})),
      ),
    );
    const totals = new Map<string, number>();
    for (const langs of perRepo)
      for (const [name, bytes] of Object.entries(langs))
        totals.set(name, (totals.get(name) ?? 0) + bytes);
    const sum = [...totals.values()].reduce((a, b) => a + b, 0) || 1;
    const languages = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, bytes]) => ({
        name,
        bytes,
        percent: Math.round((bytes / sum) * 1000) / 10,
        color: LANGUAGE_COLORS[name] ?? "#8b949e",
      }));

    const [contributions, prs] = await Promise.all([
      fetchContributions(username),
      gh<{
        items: {
          title: string;
          html_url: string;
          repository_url: string;
          created_at: string;
          pull_request?: { merged_at: string | null };
        }[];
      }>(
        `/search/issues?q=${encodeURIComponent(`type:pr author:${username} -user:${username} is:merged`)}&sort=created&order=desc&per_page=20`,
      ),
    ]);

    await GithubCache.findOneAndUpdate(
      { key: "default" },
      {
        $set: {
          username,
          profile: {
            name: user.name ?? username,
            avatarUrl: user.avatar_url,
            htmlUrl: user.html_url,
            bio: user.bio ?? "",
            publicRepos: user.public_repos,
            followers: user.followers,
          },
          repos: repos.map((r) => ({
            name: r.name,
            fullName: r.full_name,
            description: r.description ?? "",
            htmlUrl: r.html_url,
            homepage: r.homepage ?? "",
            stars: r.stargazers_count,
            forks: r.forks_count,
            language: r.language ?? "",
            topics: r.topics ?? [],
            fork: r.fork,
            archived: r.archived,
            pushedAt: new Date(r.pushed_at),
          })),
          languages,
          contributions,
          pullRequests: prs.items.map((pr) => {
            const repo = pr.repository_url.replace(`${API}/repos/`, "");
            return {
              title: pr.title,
              url: pr.html_url,
              repo,
              repoUrl: `https://github.com/${repo}`,
              merged: !!pr.pull_request?.merged_at,
              createdAt: new Date(pr.created_at),
            };
          }),
          fetchedAt: new Date(),
        },
        $unset: { error: 1, errorAt: 1 },
      },
      { upsert: true },
    );
    void revalidate({ tags: ["github"] });
    return { synced: true, repos: repos.length, languages: languages.length };
  } catch (err) {
    const message =
      err instanceof GithubError ? err.message : `Sync failed: ${(err as Error).message}`;
    logger.warn({ message }, "GitHub sync failed");
    await GithubCache.findOneAndUpdate(
      { key: "default" },
      { $set: { error: message, errorAt: new Date() } },
      { upsert: true },
    );
    return { synced: false, reason: message };
  }
}

type CachedRepo = {
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  homepage: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  fork: boolean;
  archived: boolean;
  pushedAt: Date;
};
type CachedGithub = {
  username?: string;
  profile?: {
    name: string;
    avatarUrl: string;
    htmlUrl: string;
    bio: string;
    publicRepos: number;
    followers: number;
  };
  repos?: CachedRepo[];
  languages?: { name: string; bytes: number; percent: number; color: string }[];
  contributions?: {
    total: number;
    weeks: { days: { date: string; count: number; level: number }[] }[];
  } | null;
  pullRequests?: {
    title: string;
    url: string;
    repo: string;
    repoUrl: string;
    merged: boolean;
    createdAt: Date;
  }[];
  fetchedAt?: Date;
  error?: string;
  errorAt?: Date;
};

/** Public GitHub section data (null when no username or nothing fetched yet). */
export async function getPublicGithub() {
  const [config, cache] = await Promise.all([
    GithubConfig.findOne({ key: "default" }).lean(),
    GithubCache.findOne({ key: "default" }).lean<CachedGithub>(),
  ]);
  if (!config?.username || !cache?.fetchedAt || cache.username !== config.username) return null;

  const own = (cache.repos ?? []).filter((r) => !r.fork);
  const byName = new Map(own.map((r) => [r.name, r]));
  const pinned = config.pinnedRepos?.length
    ? config.pinnedRepos.map((name) => byName.get(name)).filter(Boolean)
    : [...own]
        .filter((r) => !r.archived)
        .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
        .slice(0, 6);

  return {
    username: cache.username,
    profile: cache.profile,
    pinned,
    languages: config.showLanguages ? (cache.languages ?? []).slice(0, 8) : [],
    contributions: config.showContributions ? (cache.contributions ?? null) : null,
    pullRequests: config.showPullRequests ? (cache.pullRequests ?? []).slice(0, 10) : [],
    totals: {
      repos: cache.profile?.publicRepos ?? own.length,
      stars: own.reduce((sum, r) => sum + (r.stars ?? 0), 0),
      followers: cache.profile?.followers ?? 0,
    },
    fetchedAt: cache.fetchedAt,
  };
}

/** Admin: settings + cache status + the repo list for the pinned-repo picker. */
export async function getGithubAdmin() {
  const cache = await GithubCache.findOne({ key: "default" }).lean<CachedGithub>();
  return {
    hasToken: !!env.GITHUB_TOKEN,
    hasJobsSecret: !!env.JOBS_SECRET,
    username: cache?.username ?? "",
    fetchedAt: cache?.fetchedAt ?? null,
    error: cache?.error ?? null,
    errorAt: cache?.errorAt ?? null,
    hasContributions: !!cache?.contributions?.weeks?.length,
    pullRequests: cache?.pullRequests?.length ?? 0,
    repos: (cache?.repos ?? [])
      .filter((r) => !r.fork)
      .map((r) => ({
        name: r.name,
        description: r.description,
        stars: r.stars,
        language: r.language,
        archived: r.archived,
      })),
  };
}
