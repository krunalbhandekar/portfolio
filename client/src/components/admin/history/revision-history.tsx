"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History, LoaderCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useConfirm } from "../kit/confirm-dialog";
import { diffDocuments, diffWords, plain, prettyPath } from "./diff";

export type RevisionSummary = {
  _id: string;
  resource: string;
  documentId: string;
  action: string;
  label?: string;
  createdAt: string;
};
type Revision = RevisionSummary & { snapshot: Record<string, unknown> };

/** What happened right after this snapshot was taken. */
export const ACTION_LABELS: Record<string, string> = {
  update: "Before an edit",
  delete: "Before deletion",
  publish: "Before publishing",
  unpublish: "Before unpublishing",
  schedule: "Before scheduling",
  restore: "Before a restore",
};

export const formatWhen = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );

function Diff({ before, after }: { before: unknown; after: unknown }) {
  const changes = useMemo(() => diffDocuments(before, after), [before, after]);
  if (!changes.length) {
    return <p className="text-sm text-muted-foreground">Identical to the current version.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {changes.map((change) => {
        const a = plain(change.before);
        const b = plain(change.after);
        const words = a.length + b.length < 6000 ? diffWords(a, b) : null;
        return (
          <li key={change.path} className="rounded-lg border bg-surface p-3 text-sm">
            <p className="mb-1.5 font-mono text-[0.7rem] text-muted-foreground">
              {prettyPath(change.path)}
            </p>
            {words ? (
              <p className="leading-relaxed break-words whitespace-pre-wrap">
                {words.map((part, i) =>
                  part.type === "same" ? (
                    <span key={i}>{part.text}</span>
                  ) : part.type === "removed" ? (
                    <span
                      key={i}
                      className="rounded bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                    >
                      <span className="sr-only">[comes back: </span>
                      {part.text}
                      <span className="sr-only">]</span>
                    </span>
                  ) : (
                    <span
                      key={i}
                      className="rounded bg-red-500/15 text-red-800 line-through decoration-red-500/60 dark:text-red-300"
                    >
                      <span className="sr-only">[goes away: </span>
                      {part.text}
                      <span className="sr-only">]</span>
                    </span>
                  ),
                )}
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <p className="line-clamp-6 rounded bg-emerald-500/10 p-2 break-words">{a || "—"}</p>
                <p className="line-clamp-6 rounded bg-red-500/10 p-2 break-words">{b || "—"}</p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Revision history drawer (portfolio.md §4 #6): every save, publish, schedule, delete and
 * restore keeps the previous version. Shows what restoring a version would change against the
 * current document, then restores it (the current state is kept as a revision too).
 */
export function RevisionHistory({
  resource,
  documentId,
  current,
  disabled,
  onRestored,
}: {
  /** Server resource name, e.g. "projects", "settings", "pages.now". */
  resource: string;
  documentId: string | undefined;
  /** The current saved document (diff baseline). */
  current: unknown;
  disabled?: boolean;
  onRestored?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const list = useQuery({
    queryKey: ["admin", "revisions", resource, documentId],
    queryFn: ({ signal }) =>
      api.get<RevisionSummary[]>(
        `/admin/revisions?resource=${encodeURIComponent(resource)}&documentId=${documentId}`,
        { signal },
      ),
    enabled: open && !!documentId,
  });
  const active = selected ?? list.data?.[0]?._id ?? null;
  const revision = useQuery({
    queryKey: ["admin", "revision", active],
    queryFn: ({ signal }) => api.get<Revision>(`/admin/revisions/${active}`, { signal }),
    enabled: open && !!active,
  });

  const restore = useMutation({
    mutationFn: (id: string) =>
      api.post<{ missingMedia: number }>(`/admin/revisions/${id}/restore`),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Version restored — the site will refresh shortly");
      if (result.missingMedia) {
        toast.warning(
          `${result.missingMedia} image(s) in that version were deleted from the media library; replace them before saving.`,
        );
      }
      setOpen(false);
      onRestored?.();
    },
    onError: (err) => toast.error("Couldn't restore", { description: err.message }),
  });

  const onRestore = async () => {
    if (!revision.data) return;
    const ok = await confirm({
      title: "Restore this version?",
      description:
        "The highlighted changes are applied immediately (published items update on the site). The current version is kept in history, so you can undo this.",
      confirmLabel: "Restore",
    });
    if (ok) restore.mutate(revision.data._id);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        disabled={disabled || !documentId}
        onClick={() => {
          setSelected(null);
          setOpen(true);
        }}
      >
        <History aria-hidden="true" /> History
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-3xl">
          <SheetHeader className="border-b">
            <SheetTitle>Version history</SheetTitle>
            <SheetDescription>
              Pick a version to see what restoring it would change. Green comes back, red goes away.
            </SheetDescription>
          </SheetHeader>
          <div className="grid min-h-0 flex-1 sm:grid-cols-[220px_minmax(0,1fr)]">
            <ul
              className="max-h-48 overflow-y-auto border-b sm:max-h-none sm:border-r sm:border-b-0"
              aria-label="Versions"
            >
              {list.isPending ? (
                <li className="p-4">
                  <Skeleton className="h-16 w-full" />
                </li>
              ) : list.data?.length ? (
                list.data.map((r) => (
                  <li key={r._id}>
                    <button
                      type="button"
                      aria-current={r._id === active ? "true" : undefined}
                      onClick={() => setSelected(r._id)}
                      className={cn(
                        "flex w-full flex-col items-start gap-0.5 border-b px-4 py-2.5 text-left text-sm hover:bg-accent/50",
                        r._id === active && "bg-accent",
                      )}
                    >
                      <span className="font-medium">{formatWhen(r.createdAt)}</span>
                      <span className="text-xs text-muted-foreground">
                        {ACTION_LABELS[r.action] ?? r.action}
                      </span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="p-4 text-sm text-muted-foreground">
                  No earlier versions yet. Each save from now on keeps one (last 30).
                </li>
              )}
            </ul>
            <div className="flex min-h-0 flex-col">
              <div className="flex-1 overflow-y-auto p-4">
                {revision.data ? (
                  <Diff before={revision.data.snapshot} after={current} />
                ) : active ? (
                  <Skeleton className="h-40 w-full" />
                ) : null}
              </div>
              {revision.data ? (
                <div className="flex items-center justify-end gap-2 border-t p-3">
                  <Button type="button" onClick={onRestore} disabled={restore.isPending}>
                    {restore.isPending ? (
                      <LoaderCircle className="animate-spin" aria-hidden="true" />
                    ) : (
                      <RotateCcw aria-hidden="true" />
                    )}
                    Restore this version
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
