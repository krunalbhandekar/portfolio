"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock, FilePen, Inbox, Server } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentAdmin } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AnalyticsPanel } from "./analytics-panel";

type DashboardData = {
  lastLoginAt: string | null;
  database: "up" | "down";
  counts: { key: string; label: string; total: number; drafts: number }[];
  drafts: number;
  messages: { unread: number; total: number };
  recentEdits: {
    action: string;
    entity?: string;
    entityId?: string;
    label: string;
    createdAt: string;
  }[];
};

/** API resource key → admin URL segment (where they differ). */
const ADMIN_PATH: Record<string, string> = {
  experiences: "experience",
  "built-features": "built",
  resumes: "resume",
  posts: "blog",
};
const adminHref = (resource: string, id?: string) =>
  `/admin/${ADMIN_PATH[resource] ?? resource}${id ? `/${id}` : ""}`;

const VERBS: Record<string, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  publish: "Published",
  unpublish: "Unpublished",
  reorder: "Reordered",
};

const formatDate = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(iso),
      )
    : "—";

function Tile({
  icon: Icon,
  label,
  value,
  href,
  highlight,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  href?: string;
  highlight?: boolean;
}) {
  const body = (
    <>
      <span className="flex items-center gap-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </span>
      <span className={cn("truncate text-xl font-semibold", highlight && "text-brand-text")}>
        {value}
      </span>
    </>
  );
  const className = "flex flex-col gap-3 rounded-2xl border bg-card p-5";
  return href ? (
    <Link href={href} className={cn(className, "hover:border-foreground/20")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function DashboardOverview() {
  const { data: admin } = useCurrentAdmin();
  const dashboard = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: ({ signal }) => api.get<DashboardData>("/admin/dashboard", { signal }),
  });
  const data = dashboard.data;
  const firstName = admin?.name?.split(" ")[0];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs tracking-widest text-brand-text uppercase">Dashboard</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
      </header>

      {dashboard.isError ? (
        <p className="text-sm text-destructive">{dashboard.error.message}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          icon={Inbox}
          label="Unread messages"
          value={data ? String(data.messages.unread) : "…"}
          href="/admin/messages"
          highlight={!!data?.messages.unread}
        />
        <Tile icon={FilePen} label="Drafts" value={data ? String(data.drafts) : "…"} />
        <Tile icon={Clock} label="Last sign-in" value={data ? formatDate(data.lastLoginAt) : "…"} />
        <Tile
          icon={Server}
          label="API & database"
          value={!data ? "…" : data.database === "up" ? "Online" : "Database down"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border bg-card">
          <h2 className="border-b px-5 py-3 text-sm font-semibold">Content</h2>
          {!data ? (
            <div className="flex flex-col gap-2 p-5">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            <ul className="divide-y">
              {data.counts.map((c) => (
                <li key={c.key}>
                  <Link
                    href={adminHref(c.key)}
                    className="flex items-center justify-between px-5 py-2.5 text-sm hover:bg-accent/50"
                  >
                    <span>{c.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {c.total}
                      {c.drafts ? (
                        <span className="ml-2 text-amber-700 dark:text-amber-400">
                          {c.drafts} draft{c.drafts === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border bg-card">
          <h2 className="border-b px-5 py-3 text-sm font-semibold">Recent edits</h2>
          {!data ? (
            <div className="flex flex-col gap-2 p-5">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : data.recentEdits.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No edits yet.</p>
          ) : (
            <ul className="divide-y">
              {data.recentEdits.map((e, i) => {
                const [resource = "", verb = ""] = e.action.split(".");
                const linkable =
                  e.entityId &&
                  verb !== "delete" &&
                  !["settings", "homepage", "about", "media", "messages"].includes(resource);
                const text = (
                  <>
                    <span className="text-muted-foreground">{VERBS[verb] ?? verb}</span>{" "}
                    {e.label || resource}
                  </>
                );
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
                  >
                    {linkable ? (
                      <Link
                        href={adminHref(resource, e.entityId)}
                        className="truncate hover:underline"
                      >
                        {text}
                      </Link>
                    ) : (
                      <span className="truncate">{text}</span>
                    )}
                    <span className="shrink-0 font-mono text-[0.7rem] text-muted-foreground">
                      {formatDate(e.createdAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <AnalyticsPanel />
    </div>
  );
}
