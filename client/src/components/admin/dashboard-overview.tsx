"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, FolderKanban, Server, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { useCurrentAdmin } from "@/hooks/use-auth";
import { api } from "@/lib/api";

type DashboardData = { lastLoginAt: string | null; database: "up" | "down" };

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
      <span className="flex items-center gap-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </span>
      <span className="truncate text-sm font-medium">{value}</span>
    </div>
  );
}

const formatDate = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(iso),
      )
    : "—";

export function DashboardOverview() {
  const { data: admin } = useCurrentAdmin();
  const dashboard = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: ({ signal }) => api.get<DashboardData>("/admin/dashboard", { signal }),
  });

  const firstName = admin?.name?.split(" ")[0];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs tracking-widest text-brand-text uppercase">Dashboard</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Content stats, recent edits and messages will appear here as modules are added.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={ShieldCheck} label="Signed in as" value={admin?.email ?? "—"} />
        <StatCard
          icon={Clock}
          label="Last sign-in"
          value={dashboard.isPending ? "Loading…" : formatDate(dashboard.data?.lastLoginAt ?? null)}
        />
        <StatCard
          icon={Server}
          label="API & database"
          value={
            dashboard.isPending
              ? "Checking…"
              : dashboard.isError
                ? "Unreachable"
                : dashboard.data?.database === "up"
                  ? "Online"
                  : "Database down"
          }
        />
      </div>

      <EmptyState
        icon={FolderKanban}
        title="No content modules yet"
        description="Site settings, projects, experience, skills, resume and the media library arrive in Phase 3."
      />
    </div>
  );
}
