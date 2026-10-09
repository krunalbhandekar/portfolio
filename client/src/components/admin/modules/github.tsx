"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormContext, useWatch } from "react-hook-form";
import { ArrowDown, ArrowUp, LoaderCircle, RefreshCw, Star, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Callout } from "@/components/shared/callout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SwitchField, TextField } from "../kit/fields";
import { FormSection } from "../kit/layout";
import type { SingletonConfig } from "../resources/types";

type GithubStatus = {
  hasToken: boolean;
  hasJobsSecret: boolean;
  username: string;
  fetchedAt: string | null;
  error: string | null;
  errorAt: string | null;
  hasContributions: boolean;
  pullRequests: number;
  repos: {
    name: string;
    description: string;
    stars: number;
    language: string;
    archived: boolean;
  }[];
};

const statusKey = ["admin", "github", "status"] as const;
const MAX_PINNED = 6;

const when = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(iso),
      )
    : "never";

function SyncStatus() {
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: statusKey,
    queryFn: ({ signal }) => api.get<GithubStatus>("/admin/github", { signal }),
  });
  const refresh = useMutation({
    mutationFn: () =>
      api.post<{ synced: boolean; reason?: string; repos?: number; status: GithubStatus }>(
        "/admin/github/refresh",
      ),
    onSuccess: (result) => {
      queryClient.setQueryData(statusKey, result.status);
      if (result.synced) toast.success(`Synced ${result.repos ?? 0} repositories from GitHub`);
      else toast.error(result.reason ?? "GitHub sync failed");
    },
    onError: (error) => toast.error(error.message),
  });
  const data = status.data;

  return (
    <FormSection
      title="Sync status"
      description="The site never calls GitHub directly: a daily cron job (and this button) refresh a cached copy."
    >
      <div className="flex flex-col gap-3 text-sm sm:col-span-2">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span>
            Last sync: <span className="font-medium">{data ? when(data.fetchedAt) : "…"}</span>
          </span>
          {data?.fetchedAt ? (
            <span className="text-muted-foreground">
              {data.repos.length} repos ·{" "}
              {data.hasContributions ? "contribution graph" : "no contribution graph"} ·{" "}
              {data.pullRequests} merged OSS PRs
            </span>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto"
            disabled={refresh.isPending}
            onClick={() => refresh.mutate()}
          >
            {refresh.isPending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw aria-hidden="true" />
            )}
            Refresh now
          </Button>
        </div>
        {data?.error ? (
          <Callout variant="warning">
            Last attempt failed ({when(data.errorAt)}): {data.error}. The previous data is still
            shown on the site.
          </Callout>
        ) : null}
        {data && !data.hasToken ? (
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-500" aria-hidden="true" />
            No GITHUB_TOKEN on the server: repos and languages still work (60 requests/hour), but
            the contribution graph needs a token.
          </p>
        ) : null}
        {data && !data.hasJobsSecret ? (
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-500" aria-hidden="true" />
            No JOBS_SECRET on the server, so the daily cron job can&apos;t run yet.
          </p>
        ) : null}
      </div>
    </FormSection>
  );
}

function PinnedRepos() {
  const { setValue } = useFormContext();
  const pinned = (useWatch({ name: "pinnedRepos" }) as string[] | undefined) ?? [];
  const status = useQuery({
    queryKey: statusKey,
    queryFn: ({ signal }) => api.get<GithubStatus>("/admin/github", { signal }),
  });
  const repos = status.data?.repos ?? [];
  const set = (next: string[]) => setValue("pinnedRepos", next, { shouldDirty: true });
  const toggle = (name: string) =>
    set(pinned.includes(name) ? pinned.filter((n) => n !== name) : [...pinned, name]);
  const move = (index: number, by: -1 | 1) => {
    const next = [...pinned];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item!);
    set(next);
  };

  return (
    <FormSection
      title="Featured repositories"
      description={`Pick up to ${MAX_PINNED}, in display order. None picked = your most-starred repos.`}
    >
      <div className="flex flex-col gap-4 sm:col-span-2">
        {pinned.length ? (
          <ol className="flex flex-col gap-1.5">
            {pinned.map((name, i) => (
              <li
                key={name}
                className="flex items-center gap-2 rounded-lg border bg-surface px-3 py-1.5 text-sm"
              >
                <span className="w-5 font-mono text-xs text-muted-foreground">{i + 1}.</span>
                <span className="flex-1 font-mono">{name}</span>
                {!repos.some((r) => r.name === name) && status.data ? (
                  <span className="text-xs text-amber-600">not found in last sync</span>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move ${name} up`}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move ${name} down`}
                  disabled={i === pinned.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown />
                </Button>
              </li>
            ))}
          </ol>
        ) : null}
        {repos.length ? (
          <ul className="grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2">
            {repos.map((repo) => {
              const checked = pinned.includes(repo.name);
              const disabled = !checked && pinned.length >= MAX_PINNED;
              return (
                <li key={repo.name}>
                  <label
                    className={cn(
                      "flex h-full cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-colors",
                      checked ? "border-brand bg-brand/5" : "hover:border-foreground/20",
                      disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(repo.name)}
                      className="mt-0.5 accent-(--brand)"
                    />
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="flex items-center gap-2 font-mono font-medium">
                        <span className="truncate">{repo.name}</span>
                        <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
                          <Star className="size-3" aria-hidden="true" /> {repo.stars}
                        </span>
                      </span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {[repo.language, repo.description].filter(Boolean).join(" · ") ||
                          "No description"}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {status.isPending
              ? "Loading repositories…"
              : "Save your username, then click Refresh now to load your repositories."}
          </p>
        )}
      </div>
    </FormSection>
  );
}

function GithubFields() {
  return (
    <>
      <FormSection title="Account">
        <TextField
          name="username"
          label="GitHub username"
          placeholder="krunalbhandekar"
          description="Empty hides the GitHub page and card. After changing it, save and click Refresh now."
        />
      </FormSection>
      <SyncStatus />
      <PinnedRepos />
      <FormSection title="Sections" description="What the /github page shows.">
        <SwitchField name="showContributions" label="Contribution graph" wide />
        <SwitchField name="showLanguages" label="Language breakdown" wide />
        <SwitchField name="showPullRequests" label="Open-source pull requests" wide />
      </FormSection>
    </>
  );
}

export const githubConfig: SingletonConfig = {
  apiPath: "github/settings",
  title: "GitHub",
  description: "Pinned repositories, contribution graph and open-source PRs, synced daily.",
  defaults: {
    username: "",
    pinnedRepos: [],
    showContributions: true,
    showLanguages: true,
    showPullRequests: true,
  },
  Fields: GithubFields,
};
