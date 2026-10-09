"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Cloud, Download, Eye, Inbox, TriangleAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Analytics = {
  days: number;
  totals: { views: number; downloads: number; messages: number };
  series: { date: string; views: number }[];
  topPages: { path: string; views: number }[];
  referrers: { host: string; views: number }[];
  topProjects: { slug: string; title: string; views: number }[];
  topCaseStudies: { slug: string; title: string; views: number }[];
  topPosts: { slug: string; title: string; views: number }[];
  resumes: {
    _id: string;
    label: string;
    slug: string;
    isDefault: boolean;
    status: string;
    downloads: number;
    allTime: number;
  }[];
};

type CloudinaryUsage = {
  plan: string;
  lastUpdated: string | null;
  credits: { used: number; limit: number | null; percent: number | null };
  storage: { usage: number; credits: number };
  bandwidth: { usage: number; credits: number };
  transformations: { usage: number; credits: number };
  resources: number | null;
};

const RANGES = [7, 30, 90] as const;
const WARN_AT = 80;

const number = new Intl.NumberFormat();
const bytes = (value: number) => {
  const units = ["B", "KB", "MB", "GB"];
  let n = value;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col rounded-2xl border bg-card", className)}>
      <h3 className="border-b px-5 py-3 text-sm font-semibold">{title}</h3>
      <div className="flex flex-1 flex-col p-5">{children}</div>
    </section>
  );
}

/** Horizontal bar list (top pages, referrers…). */
function BarList({
  rows,
  empty,
}: {
  rows: { key: string; label: React.ReactNode; value: number }[];
  empty: string;
}) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li
          key={row.key}
          className="relative flex items-center justify-between gap-3 px-2 py-1 text-sm"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 rounded-md bg-brand/12"
            style={{ width: `${(row.value / max) * 100}%` }}
          />
          <span className="relative min-w-0 truncate">{row.label}</span>
          <span className="relative font-mono text-xs text-muted-foreground tabular-nums">
            {number.format(row.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ViewsChart({ series }: { series: Analytics["series"] }) {
  const max = Math.max(...series.map((d) => d.views), 1);
  const fmt = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex h-36 items-end gap-[2px]"
        role="img"
        aria-label={`Daily page views: ${series.map((d) => `${d.date} ${d.views}`).join(", ")}`}
      >
        {series.map((d) => (
          <div
            key={d.date}
            title={`${fmt.format(new Date(d.date))}: ${d.views} views`}
            className="min-w-0 flex-1 rounded-t-sm bg-brand/70 transition-colors hover:bg-brand"
            style={{ height: `${Math.max((d.views / max) * 100, d.views ? 3 : 1)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between font-mono text-[0.65rem] text-muted-foreground">
        <span>{series[0] ? fmt.format(new Date(series[0].date)) : ""}</span>
        <span>{series.at(-1) ? fmt.format(new Date(series.at(-1)!.date)) : ""}</span>
      </div>
    </div>
  );
}

function CloudinaryWidget() {
  const usage = useQuery({
    queryKey: ["admin", "media", "usage"],
    queryFn: ({ signal }) => api.get<CloudinaryUsage>("/admin/media/usage", { signal }),
    staleTime: 10 * 60_000,
  });
  const data = usage.data;
  const percent =
    data?.credits.percent ??
    (data?.credits.limit ? (data.credits.used / data.credits.limit) * 100 : null);
  const warn = percent !== null && percent >= WARN_AT;

  return (
    <Panel title="Cloudinary usage">
      {usage.isError ? (
        <p className="text-sm text-destructive">{usage.error.message}</p>
      ) : !data ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex items-center gap-1.5">
                <Cloud className="size-4 text-muted-foreground" aria-hidden="true" />
                {data.plan} plan · monthly credits
              </span>
              <span
                className={cn(
                  "font-mono text-xs",
                  warn && "font-semibold text-amber-600 dark:text-amber-400",
                )}
              >
                {data.credits.used.toFixed(2)}
                {data.credits.limit ? ` / ${data.credits.limit}` : ""}
                {percent !== null ? ` (${Math.round(percent)}%)` : ""}
              </span>
            </div>
            {percent !== null ? (
              <div
                role="progressbar"
                aria-label="Cloudinary credits used"
                aria-valuenow={Math.round(percent)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className={cn("h-full rounded-full", warn ? "bg-amber-500" : "bg-brand")}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
            ) : null}
            {warn ? (
              <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Over {WARN_AT}% of this month&apos;s credits. Delete unused files in the{" "}
                <Link href="/admin/media" className="underline">
                  media library
                </Link>{" "}
                or wait for the monthly reset.
              </p>
            ) : null}
          </div>
          <dl className="grid grid-cols-3 gap-3 border-t pt-3 text-xs">
            {(
              [
                ["Storage", bytes(data.storage.usage), data.storage.credits],
                ["Bandwidth", bytes(data.bandwidth.usage), data.bandwidth.credits],
                [
                  "Transforms",
                  number.format(data.transformations.usage),
                  data.transformations.credits,
                ],
              ] as const
            ).map(([label, value, credits]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-mono">{value}</dd>
                <dd className="font-mono text-[0.65rem] text-muted-foreground">
                  {credits.toFixed(2)} cr
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </Panel>
  );
}

/** Dashboard v2 (portfolio.md §4 #10–11): privacy-friendly analytics + Cloudinary credits. */
export function AnalyticsPanel() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const analytics = useQuery({
    queryKey: ["admin", "analytics", days],
    queryFn: ({ signal }) => api.get<Analytics>(`/admin/analytics?days=${days}`, { signal }),
  });
  const data = analytics.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Analytics</h2>
        <div
          role="group"
          aria-label="Date range"
          className="flex rounded-lg border bg-surface p-0.5"
        >
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              aria-pressed={days === range}
              onClick={() => setDays(range)}
              className={cn(
                "rounded-md px-3 py-1 font-mono text-xs",
                days === range
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {range}d
            </button>
          ))}
        </div>
      </div>

      {analytics.isError ? (
        <p className="text-sm text-destructive">{analytics.error.message}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            [Eye, "Page views", data?.totals.views],
            [Download, "Resume downloads", data?.totals.downloads],
            [Inbox, "Contact messages", data?.totals.messages],
          ] as const
        ).map(([Icon, label, value]) => (
          <div key={label} className="flex flex-col gap-2 rounded-2xl border bg-card p-5">
            <span className="flex items-center gap-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
              <Icon className="size-3.5" aria-hidden="true" /> {label}
            </span>
            <span className="text-2xl font-semibold tabular-nums">
              {value === undefined ? "…" : number.format(value)}
            </span>
          </div>
        ))}
      </div>

      <Panel title={`Views per day · last ${days} days`}>
        {data ? <ViewsChart series={data.series} /> : <Skeleton className="h-36 w-full" />}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top pages">
          {data ? (
            <BarList
              rows={data.topPages.map((p) => ({ key: p.path, label: p.path, value: p.views }))}
              empty="No views yet."
            />
          ) : (
            <Skeleton className="h-32 w-full" />
          )}
        </Panel>
        <Panel title="Referrers">
          {data ? (
            <BarList
              rows={data.referrers.map((r) => ({ key: r.host, label: r.host, value: r.views }))}
              empty="No external referrers yet (direct visits aren't listed)."
            />
          ) : (
            <Skeleton className="h-32 w-full" />
          )}
        </Panel>
        <Panel title="Top projects">
          {data ? (
            <BarList
              rows={data.topProjects.map((p) => ({
                key: p.slug,
                label: (
                  <a
                    href={`/projects/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {p.title}
                  </a>
                ),
                value: p.views,
              }))}
              empty="No project views yet."
            />
          ) : (
            <Skeleton className="h-32 w-full" />
          )}
        </Panel>
        <Panel title="Top posts & case studies">
          {data ? (
            <BarList
              rows={[
                ...data.topPosts.map((p) => ({
                  key: `post-${p.slug}`,
                  label: `📝 ${p.title}`,
                  value: p.views,
                })),
                ...data.topCaseStudies.map((c) => ({
                  key: `cs-${c.slug}`,
                  label: `📚 ${c.title}`,
                  value: c.views,
                })),
              ]
                .sort((a, b) => b.value - a.value)
                .slice(0, 8)}
              empty="No post or case-study views yet."
            />
          ) : (
            <Skeleton className="h-32 w-full" />
          )}
        </Panel>
        <Panel title="Resume downloads by version">
          {data ? (
            data.resumes.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left font-mono text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                    <th className="pb-2 font-normal">Version</th>
                    <th className="pb-2 text-right font-normal">{days}d</th>
                    <th className="pb-2 text-right font-normal">All time</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.resumes.map((r) => (
                    <tr key={r._id}>
                      <td className="py-2">
                        {r.label}
                        {r.isDefault ? (
                          <span className="ml-2 font-mono text-[0.65rem] text-brand-text">
                            default
                          </span>
                        ) : null}
                        {r.status !== "published" ? (
                          <span className="ml-2 font-mono text-[0.65rem] text-muted-foreground">
                            draft
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2 text-right font-mono tabular-nums">{r.downloads}</td>
                      <td className="py-2 text-right font-mono text-muted-foreground tabular-nums">
                        {r.allTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">No resumes uploaded yet.</p>
            )
          ) : (
            <Skeleton className="h-32 w-full" />
          )}
        </Panel>
        <CloudinaryWidget />
      </div>
      <p className="text-xs text-muted-foreground">
        Counted without cookies; bots, previews and your own signed-in visits are excluded. Events
        are kept for 180 days.
      </p>
    </div>
  );
}
