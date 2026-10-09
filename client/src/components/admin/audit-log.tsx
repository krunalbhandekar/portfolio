"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatWhen } from "./history/revision-history";
import { PageHeader } from "./kit/layout";

type AuditEntry = {
  _id: string;
  action: string;
  outcome: "success" | "failure";
  entity?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
  adminEmail: string | null;
  createdAt: string;
};

const selectClass =
  "h-9 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30";

/** Admin audit log (portfolio.md §4 #6): who changed what, when and from where. */
export function AuditLog() {
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [outcome, setOutcome] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page: String(page), limit: "50" });
  if (entity) params.set("entity", entity);
  if (action) params.set("action", action);
  if (outcome) params.set("outcome", outcome);
  if (from) params.set("from", new Date(`${from}T00:00:00`).toISOString());
  if (to) params.set("to", new Date(`${to}T23:59:59.999`).toISOString());

  const entities = useQuery({
    queryKey: ["admin", "audit", "entities"],
    queryFn: ({ signal }) => api.get<string[]>("/admin/audit/entities", { signal }),
  });
  const log = useQuery({
    queryKey: ["admin", "audit", params.toString()],
    queryFn: ({ signal }) => api.list<AuditEntry>(`/admin/audit?${params}`, { signal }),
    placeholderData: keepPreviousData,
  });
  const reset = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Operations"
        title="Audit log"
        description="Every admin change and sign-in, newest first. Kept indefinitely."
      />
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Content type
          <select
            value={entity}
            onChange={(e) => reset(() => setEntity(e.target.value))}
            className={selectClass}
          >
            <option value="">All</option>
            {(entities.data ?? []).map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Action contains
          <Input
            value={action}
            onChange={(e) => reset(() => setAction(e.target.value))}
            placeholder="publish, delete, login…"
            className="h-9 w-48"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Outcome
          <select
            value={outcome}
            onChange={(e) => reset(() => setOutcome(e.target.value))}
            className={selectClass}
          >
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          From
          <Input
            type="date"
            value={from}
            onChange={(e) => reset(() => setFrom(e.target.value))}
            className="h-9"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          To
          <Input
            type="date"
            value={to}
            onChange={(e) => reset(() => setTo(e.target.value))}
            className="h-9"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left font-mono text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-3 font-normal">When</th>
              <th className="px-4 py-3 font-normal">Action</th>
              <th className="px-4 py-3 font-normal">Item</th>
              <th className="hidden px-4 py-3 font-normal md:table-cell">By</th>
              <th className="hidden px-4 py-3 font-normal lg:table-cell">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {log.isPending ? (
              <tr>
                <td colSpan={5} className="p-4">
                  <Skeleton className="h-24 w-full" />
                </td>
              </tr>
            ) : log.data?.items.length ? (
              log.data.items.map((entry) => (
                <tr
                  key={entry._id}
                  className={cn(entry.outcome === "failure" && "bg-destructive/5")}
                >
                  <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-muted-foreground">
                    {formatWhen(entry.createdAt)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    {entry.action}
                    {entry.outcome === "failure" ? (
                      <span className="ml-2 text-destructive">failed</span>
                    ) : null}
                  </td>
                  <td className="max-w-xs truncate px-4 py-2.5">
                    {String(entry.meta?.label ?? entry.meta?.reason ?? entry.meta?.email ?? "—")}
                    {entry.meta?.scheduled ? (
                      <span className="ml-2 text-xs text-sky-600">scheduled</span>
                    ) : null}
                  </td>
                  <td className="hidden px-4 py-2.5 text-xs text-muted-foreground md:table-cell">
                    {entry.adminEmail ?? (entry.action.startsWith("auth.") ? "—" : "System (job)")}
                  </td>
                  <td className="hidden px-4 py-2.5 font-mono text-xs text-muted-foreground lg:table-cell">
                    {entry.ip ?? "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                  No entries match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {log.data && log.data.meta.totalPages > 1 ? (
        <div className="flex items-center justify-end gap-3 text-sm">
          <span className="text-muted-foreground">
            Page {log.data.meta.page} of {log.data.meta.totalPages} · {log.data.meta.total} entries
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={page >= log.data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
