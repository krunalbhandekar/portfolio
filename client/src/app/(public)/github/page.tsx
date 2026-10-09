import type { Metadata } from "next";
import { ExternalLink, GitMerge, GitPullRequest } from "lucide-react";
import { ContributionGraph } from "@/components/github/contribution-graph";
import { LanguageBar } from "@/components/github/language-bar";
import { RepoCard } from "@/components/github/repo-card";
import { EmptyState } from "@/components/shared/empty-state";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeader } from "@/components/shared/section-header";
import { SocialIcon } from "@/components/shared/social-icon";
import { Stat } from "@/components/shared/stat";
import { buttonVariants } from "@/components/ui/button";
import { getGithub, getSettings } from "@/lib/data/public";
import { formatDate } from "@/lib/format";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    title: "Open Source & GitHub",
    description: `${settings.name}'s public repositories, contribution activity, languages and open-source pull requests.`,
    path: "/github",
    settings,
  });
}

export default async function GithubPage() {
  const github = await getGithub();
  return (
    <div className="container-page flex flex-col gap-12 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "GitHub", path: "/github" },
        ])}
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          as="h1"
          eyebrow="Open source"
          title="GitHub activity"
          description="Public repositories, what I write them in, and contributions to other projects."
        />
        {github ? (
          <a
            href={github.profile.htmlUrl}
            target="_blank"
            rel="noopener noreferrer me"
            className={buttonVariants({ variant: "outline" })}
          >
            <SocialIcon name="github" className="size-4" /> @{github.username}
          </a>
        ) : null}
      </div>

      {!github ? (
        <EmptyState title="GitHub activity coming soon" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-6 rounded-2xl border bg-card p-6 sm:grid-cols-4">
            <Stat value={String(github.totals.repos)} label="Public repos" />
            <Stat value={String(github.totals.stars)} label="Stars earned" />
            {github.contributions ? (
              <Stat value={String(github.contributions.total)} label="Contributions this year" />
            ) : null}
            {github.pullRequests.length ? (
              <Stat value={String(github.pullRequests.length)} label="Merged OSS PRs" />
            ) : null}
          </div>

          {github.contributions ? (
            <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
              <h2 className="font-mono text-xs tracking-widest text-brand-text uppercase">
                Contributions · last 12 months
              </h2>
              <ContributionGraph contributions={github.contributions} />
            </section>
          ) : null}

          {github.pinned.length ? (
            <section className="flex flex-col gap-5">
              <h2 className="text-xl font-semibold tracking-tight">Featured repositories</h2>
              <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {github.pinned.map((repo) => (
                  <li key={repo.name}>
                    <RepoCard repo={repo} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-2">
            {github.languages.length ? (
              <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
                <h2 className="font-mono text-xs tracking-widest text-brand-text uppercase">
                  Languages
                </h2>
                <LanguageBar languages={github.languages} />
              </section>
            ) : null}

            {github.pullRequests.length ? (
              <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
                <h2 className="font-mono text-xs tracking-widest text-brand-text uppercase">
                  Open-source contributions
                </h2>
                <ul className="flex flex-col divide-y text-sm">
                  {github.pullRequests.map((pr) => (
                    <li key={pr.url} className="flex items-start gap-3 py-2.5">
                      {pr.merged ? (
                        <GitMerge
                          className="mt-0.5 size-4 shrink-0 text-violet-500"
                          aria-label="Merged"
                        />
                      ) : (
                        <GitPullRequest
                          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {pr.title}
                        </a>
                        <span className="font-mono text-xs text-muted-foreground">
                          {pr.repo} · {formatDate(pr.createdAt)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            Synced from GitHub daily · last update {formatDate(github.fetchedAt)}
            <a
              href={github.profile.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-brand-text hover:underline"
            >
              Profile <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </p>
        </>
      )}
    </div>
  );
}
