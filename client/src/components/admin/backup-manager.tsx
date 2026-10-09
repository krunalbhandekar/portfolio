"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DatabaseBackup, Download, FileUp, LoaderCircle, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Callout } from "@/components/shared/callout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatWhen } from "./history/revision-history";
import { useConfirm } from "./kit/confirm-dialog";
import { PageHeader } from "./kit/layout";

type Backup = { publicId: string; bytes: number; createdAt: string };
type ImportReport = {
  dryRun: boolean;
  mode: "replace" | "merge";
  createdAt: string | null;
  collections: {
    name: string;
    incoming: number;
    existing: number;
    inserted: number;
    updated: number;
    removed: number;
    invalid: number;
    errors: string[];
  }[];
  skipped: string[];
};

const kb = (bytes: number) => `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card">
      <header className="border-b px-5 py-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Backup page (portfolio.md §15 Phase 7): nightly backups, export, import with dry run. */
export function BackupManager() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [mode, setMode] = useState<"replace" | "merge">("replace");
  const [report, setReport] = useState<ImportReport | null>(null);

  const backups = useQuery({
    queryKey: ["admin", "backups"],
    queryFn: ({ signal }) => api.get<Backup[]>("/admin/backups", { signal }),
  });
  const backupNow = useMutation({
    mutationFn: () => api.post<{ publicId: string }>("/admin/backups"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "backups"] });
      toast.success("Backup stored in Cloudinary");
    },
    onError: (err) => toast.error("Backup failed", { description: err.message }),
  });
  const download = useMutation({
    mutationFn: (publicId: string) =>
      api.get<{ url: string }>(`/admin/backups/download?publicId=${encodeURIComponent(publicId)}`),
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
    onError: (err) => toast.error(err.message),
  });
  const exportAll = useMutation({
    mutationFn: () => api.download("/admin/export"),
    onSuccess: ({ blob, filename }) => saveBlob(blob, filename),
    onError: (err) => toast.error("Export failed", { description: err.message }),
  });
  const runImport = useMutation({
    mutationFn: ({ dryRun }: { dryRun: boolean }) =>
      api.post<ImportReport>(`/admin/import?dryRun=${dryRun}&mode=${mode}`, undefined, {
        text: file!.text,
      }),
    onSuccess: async (result) => {
      setReport(result);
      if (!result.dryRun) {
        await queryClient.invalidateQueries({ queryKey: ["admin"] });
        toast.success("Import complete — the site is refreshing");
      }
    },
    onError: (err) => toast.error("Import failed", { description: err.message }),
  });

  const onFile = async (f: File | undefined) => {
    setReport(null);
    if (!f) return setFile(null);
    setFile({ name: f.name, text: await f.text() });
  };

  const onImport = async () => {
    const ok = await confirm({
      title:
        mode === "replace"
          ? "Replace all content with this file?"
          : "Merge this file into the content?",
      description:
        mode === "replace"
          ? "Every content collection in the file is wiped and replaced. A backup of the current content is stored first, so you can undo it."
          : "Items in the file overwrite items with the same id; others are added. A backup of the current content is stored first.",
      confirmLabel: "Import",
      destructive: mode === "replace",
    });
    if (ok) runImport.mutate({ dryRun: false });
  };

  const invalid = report?.collections.some((c) => c.invalid > 0) ?? false;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        eyebrow="Operations"
        title="Backup & restore"
        description="A nightly job stores a full content backup in Cloudinary (private) and keeps the last 7. Media files themselves stay in Cloudinary."
        actions={
          <Button onClick={() => backupNow.mutate()} disabled={backupNow.isPending}>
            {backupNow.isPending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <DatabaseBackup aria-hidden="true" />
            )}
            Back up now
          </Button>
        }
      />

      <Card
        title="Backups"
        description="Private files: downloads use a signed link that expires after 10 minutes."
      >
        {backups.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : backups.isError ? (
          <p className="text-sm text-destructive">{backups.error.message}</p>
        ) : backups.data?.length ? (
          <ul className="divide-y text-sm">
            {backups.data.map((b) => (
              <li key={b.publicId} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium">{formatWhen(b.createdAt)}</span>
                  <span className="truncate font-mono text-[0.7rem] text-muted-foreground">
                    {b.publicId.split("/").pop()} · {kb(b.bytes)}
                  </span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={download.isPending}
                  onClick={() => download.mutate(b.publicId)}
                >
                  <Download aria-hidden="true" /> Download
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No backups yet. Click “Back up now”, and set up the nightly job (see README).
          </p>
        )}
      </Card>

      <Card
        title="Export"
        description="All content as one JSON file (no sign-in data, analytics or history)."
      >
        <Button variant="outline" onClick={() => exportAll.mutate()} disabled={exportAll.isPending}>
          {exportAll.isPending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Download aria-hidden="true" />
          )}
          Export all content
        </Button>
      </Card>

      <Card
        title="Import / restore"
        description="Restore a backup or export. Always run the dry run first: it shows exactly what would change."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              id="import-file"
              aria-label="Backup file to import"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <FileUp aria-hidden="true" /> {file ? "Choose another file" : "Choose backup file"}
            </Button>
            {file ? (
              <span className="font-mono text-xs text-muted-foreground">{file.name}</span>
            ) : null}
          </div>
          {file ? (
            <>
              <fieldset className="flex flex-col gap-2 text-sm">
                <legend className="mb-1 font-medium">Mode</legend>
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "replace"}
                    onChange={() => {
                      setMode("replace");
                      setReport(null);
                    }}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium">Replace</span> — the site ends up exactly like the
                    file (use this to restore a backup).
                  </span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "merge"}
                    onChange={() => {
                      setMode("merge");
                      setReport(null);
                    }}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium">Merge</span> — add/overwrite items from the file,
                    keep everything else.
                  </span>
                </label>
              </fieldset>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => runImport.mutate({ dryRun: true })}
                  disabled={runImport.isPending}
                >
                  {runImport.isPending ? (
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                  ) : null}
                  Dry run
                </Button>
                <Button
                  variant={mode === "replace" ? "destructive" : "default"}
                  onClick={onImport}
                  disabled={
                    !report?.dryRun || report.mode !== mode || invalid || runImport.isPending
                  }
                  title={!report?.dryRun ? "Run a dry run first" : undefined}
                >
                  Import
                </Button>
              </div>
            </>
          ) : null}

          {report ? (
            <div className="flex flex-col gap-3">
              <Callout variant={invalid ? "warning" : "info"}>
                {report.dryRun
                  ? invalid
                    ? "Dry run found invalid documents; fix the file before importing."
                    : `Dry run OK${report.createdAt ? ` (file from ${formatWhen(report.createdAt)})` : ""}. Nothing has changed yet.`
                  : "Imported."}
              </Callout>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left font-mono text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                      <th className="px-3 py-2 font-normal">Collection</th>
                      <th className="px-3 py-2 text-right font-normal">In file</th>
                      <th className="px-3 py-2 text-right font-normal">Now</th>
                      <th className="px-3 py-2 text-right font-normal">Added</th>
                      <th className="px-3 py-2 text-right font-normal">Updated</th>
                      <th className="px-3 py-2 text-right font-normal">Removed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.collections.map((c) => (
                      <tr key={c.name} className={cn(c.invalid > 0 && "bg-destructive/5")}>
                        <td className="px-3 py-2 font-mono text-xs">
                          {c.name}
                          {c.invalid ? (
                            <span
                              className="ml-2 inline-flex items-center gap-1 text-destructive"
                              title={c.errors.join("\n")}
                            >
                              <TriangleAlert className="size-3" aria-hidden="true" /> {c.invalid}{" "}
                              invalid
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{c.incoming}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">
                          {c.existing}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{c.inserted}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{c.updated}</td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right tabular-nums",
                            c.removed && "text-destructive",
                          )}
                        >
                          {c.removed}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {report.skipped.length ? (
                <p className="text-xs text-muted-foreground">
                  Skipped: {report.skipped.join(", ")}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
