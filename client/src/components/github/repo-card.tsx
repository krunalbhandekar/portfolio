import { ExternalLink, GitFork, Star } from "lucide-react";
import type { GithubRepo } from "@/lib/data/types";

const LANG_DOT: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Java: "#b07219",
};

export function RepoCard({ repo }: { repo: GithubRepo }) {
  return (
    <article className="group/repo relative flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 transition-colors hover:border-foreground/20">
      <h3 className="font-mono text-sm font-semibold">
        <a
          href={repo.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="after:absolute after:inset-0"
        >
          {repo.name}
        </a>
      </h3>
      <p className="text-sm text-muted-foreground">{repo.description || "No description"}</p>
      {repo.topics.length ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Topics">
          {repo.topics.slice(0, 4).map((t) => (
            <li
              key={t}
              className="rounded-full bg-brand/10 px-2 py-0.5 font-mono text-[0.65rem] text-brand-text"
            >
              {t}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-auto flex flex-wrap items-center gap-4 pt-1 font-mono text-xs text-muted-foreground">
        {repo.language ? (
          <span className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: LANG_DOT[repo.language] ?? "#8b949e" }}
              aria-hidden="true"
            />
            {repo.language}
          </span>
        ) : null}
        <span className="flex items-center gap-1" title="Stars">
          <Star className="size-3.5" aria-hidden="true" /> {repo.stars}
          <span className="sr-only"> stars</span>
        </span>
        <span className="flex items-center gap-1" title="Forks">
          <GitFork className="size-3.5" aria-hidden="true" /> {repo.forks}
          <span className="sr-only"> forks</span>
        </span>
        {repo.homepage ? (
          <a
            href={repo.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 ml-auto inline-flex items-center gap-1 text-brand-text hover:underline"
          >
            Live <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        ) : null}
      </p>
    </article>
  );
}
