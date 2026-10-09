"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWatch } from "react-hook-form";
import { ArrowRight, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatWhen } from "./history/revision-history";
import { useConfirm } from "./kit/confirm-dialog";
import { SwitchField, TextField } from "./kit/fields";
import { FormSection, PageHeader } from "./kit/layout";
import { SingletonEditor } from "./resources/singleton-editor";
import type { SingletonConfig } from "./resources/types";

/** Fixed pages (content items — projects, posts… — have SEO fields in their own editors). */
const SEO_PAGES = [
  ["/", "Home"],
  ["/projects", "Projects"],
  ["/case-studies", "Case studies"],
  ["/blog", "Blog"],
  ["/engineering", "Engineering"],
  ["/built", "What I Built"],
  ["/experience", "Experience"],
  ["/skills", "Skills"],
  ["/about", "About"],
  ["/github", "GitHub"],
  ["/hire", "Hire me"],
  ["/resume", "Resume"],
  ["/contact", "Contact"],
  ["/now", "Now"],
  ["/uses", "Uses"],
  ["/faq", "FAQ"],
] as const;

type SeoRow = { path: string; title: string; description: string; noindex: boolean };
const emptyRow = (path: string): SeoRow => ({ path, title: "", description: "", noindex: false });

function PageOverrides() {
  const rows = (useWatch({ name: "pages" }) as SeoRow[] | undefined) ?? [];
  return (
    <>
      <FormSection
        title="Site-wide defaults"
        description="Default title, description and share image live in Site Settings → SEO defaults."
      >
        <Link
          href="/admin/settings"
          className="inline-flex w-fit items-center gap-1 text-sm text-brand-text hover:underline sm:col-span-2"
        >
          Edit defaults in Site Settings <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </FormSection>
      {SEO_PAGES.map(([path, label], i) => (
        <FormSection
          key={path}
          title={`${label} · ${path}`}
          description={
            rows[i]?.title || rows[i]?.description || rows[i]?.noindex
              ? "Overridden"
              : "Using the page's built-in title and description"
          }
        >
          <TextField name={`pages.${i}.title`} label="Meta title" maxLength={70} />
          <TextField name={`pages.${i}.description`} label="Meta description" maxLength={160} />
          <SwitchField
            name={`pages.${i}.noindex`}
            label="Hide from search engines (noindex, removed from the sitemap)"
            wide
          />
        </FormSection>
      ))}
    </>
  );
}

const seoConfig: SingletonConfig = {
  apiPath: "seo",
  title: "Per-page SEO",
  description: "Override the title and description search engines and link previews show.",
  defaults: { pages: SEO_PAGES.map(([path]) => emptyRow(path)) },
  // Stored rows may cover only some pages: always edit one row per page, in order.
  fromDocument: (doc) => {
    const stored = new Map(((doc.pages as SeoRow[] | undefined) ?? []).map((p) => [p.path, p]));
    return {
      ...doc,
      pages: SEO_PAGES.map(([path]) => ({ ...emptyRow(path), ...stored.get(path) })),
    };
  },
  Fields: PageOverrides,
};

/* ---------------------------------------------------------------- Redirects */

type Redirect = {
  _id: string;
  from: string;
  to: string;
  statusCode: number;
  auto: boolean;
  note?: string;
  updatedAt: string;
};

function RedirectDialog({ initial, onClose }: { initial: Redirect | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [from, setFrom] = useState(initial?.from ?? "");
  const [to, setTo] = useState(initial?.to ?? "");
  const [statusCode, setStatusCode] = useState(initial?.statusCode ?? 301);
  const [note, setNote] = useState(initial?.note ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: () => {
      const body = { from, to, statusCode, note };
      return initial
        ? api.put(`/admin/redirects/${initial._id}`, body)
        : api.post("/admin/redirects", body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "redirects"] });
      toast.success("Redirect saved — live within a minute");
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError && Array.isArray(err.details)) {
        setErrors(
          Object.fromEntries(
            (err.details as { path: string; message: string }[]).map((d) => [d.path, d.message]),
          ),
        );
      } else toast.error(err.message);
    },
  });
  const field = (label: string, name: string, input: React.ReactNode) => (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      {input}
      {errors[name] ? (
        <span className="text-xs font-normal text-destructive">{errors[name]}</span>
      ) : null}
    </label>
  );
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>{initial ? "Edit redirect" : "New redirect"}</DialogTitle>
        <DialogDescription>
          Visitors and search engines opening the old URL are sent to the new one.
        </DialogDescription>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setErrors({});
            save.mutate();
          }}
        >
          {field(
            "From (old path)",
            "from",
            <Input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="/projects/old-name"
              className="h-9 font-mono"
            />,
          )}
          {field(
            "To (path or https:// URL)",
            "to",
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="/projects/new-name"
              className="h-9 font-mono"
            />,
          )}
          {field(
            "Type",
            "statusCode",
            <select
              value={statusCode}
              onChange={(e) => setStatusCode(Number(e.target.value))}
              className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm font-normal dark:bg-input/30"
            >
              <option value={301}>301 — permanent (recommended)</option>
              <option value={308}>308 — permanent, keeps method</option>
              <option value={302}>302 — temporary</option>
              <option value={307}>307 — temporary, keeps method</option>
            </select>,
          )}
          {field(
            "Note (optional)",
            "note",
            <Input value={note} onChange={(e) => setNote(e.target.value)} className="h-9" />,
          )}
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
            Save redirect
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Redirects() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Redirect | null | "new">(null);
  const list = useQuery({
    queryKey: ["admin", "redirects", q],
    queryFn: ({ signal }) =>
      api.list<Redirect>(`/admin/redirects?limit=100${q ? `&q=${encodeURIComponent(q)}` : ""}`, {
        signal,
      }),
    placeholderData: keepPreviousData,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/redirects/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "redirects"] });
      toast.success("Redirect deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        eyebrow="SEO"
        title="Redirects"
        description="Renaming a published project, case study, post or skill adds a 301 automatically, so old links and search rankings keep working."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden="true" /> New redirect
          </Button>
        }
      />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search paths…"
        className="h-9 max-w-xs"
        aria-label="Search redirects"
      />
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left font-mono text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-3 font-normal">From</th>
              <th className="px-4 py-3 font-normal">To</th>
              <th className="px-4 py-3 font-normal">Type</th>
              <th className="px-4 py-3 font-normal">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.isPending ? (
              <tr>
                <td colSpan={4} className="p-4">
                  <Skeleton className="h-16 w-full" />
                </td>
              </tr>
            ) : list.data?.items.length ? (
              list.data.items.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-2.5 font-mono text-xs break-all">{r.from}</td>
                  <td className="px-4 py-2.5 font-mono text-xs break-all">{r.to}</td>
                  <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                    {r.statusCode}
                    <span
                      className={cn(
                        "ml-2 rounded-full border px-1.5 py-0.5 font-mono text-[0.65rem]",
                        r.auto ? "text-sky-700 dark:text-sky-300" : "text-muted-foreground",
                      )}
                      title={`Updated ${formatWhen(r.updatedAt)}`}
                    >
                      {r.auto ? "auto" : "manual"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit redirect from ${r.from}`}
                      onClick={() => setEditing(r)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete redirect from ${r.from}`}
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Delete this redirect?",
                          description: `${r.from} will show "not found" again.`,
                          confirmLabel: "Delete",
                          destructive: true,
                        });
                        if (ok) remove.mutate(r._id);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-6 text-center text-sm text-muted-foreground">
                  No redirects yet. They appear here when you rename a published page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editing ? (
        <RedirectDialog
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- Sitemap preview */

function SitemapPreview() {
  const sitemap = useQuery({
    queryKey: ["admin", "sitemap-preview"],
    queryFn: async () => {
      const res = await fetch("/sitemap.xml", { cache: "no-store" });
      const xml = await res.text();
      return [
        ...xml.matchAll(
          /<url>[\s\S]*?<loc>([^<]+)<\/loc>(?:[\s\S]*?<lastmod>([^<]+)<\/lastmod>)?[\s\S]*?<\/url>/g,
        ),
      ].map((m) => ({ loc: m[1]!, lastmod: m[2] ?? null }));
    },
  });
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        eyebrow="SEO"
        title="Sitemap preview"
        description="What search engines see at /sitemap.xml: published content only, minus anything marked noindex."
        actions={
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-brand-text hover:underline"
          >
            Open sitemap.xml
          </a>
        }
      />
      <div className="rounded-2xl border bg-card">
        <p className="border-b px-4 py-3 text-sm font-medium">
          {sitemap.data ? `${sitemap.data.length} URLs` : "Loading…"}
        </p>
        <ul className="max-h-[60vh] divide-y overflow-y-auto text-sm">
          {sitemap.isPending ? (
            <li className="p-4">
              <Skeleton className="h-24 w-full" />
            </li>
          ) : (
            sitemap.data?.map((u) => (
              <li key={u.loc} className="flex items-center justify-between gap-4 px-4 py-2">
                <a
                  href={u.loc}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate font-mono text-xs hover:underline"
                >
                  {u.loc.replace(/^https?:\/\/[^/]+/, "") || "/"}
                </a>
                <span className="shrink-0 font-mono text-[0.65rem] text-muted-foreground">
                  {u.lastmod ? formatWhen(u.lastmod) : ""}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

const TABS = [
  { key: "pages", label: "Page titles" },
  { key: "redirects", label: "Redirects" },
  { key: "sitemap", label: "Sitemap" },
] as const;

/** SEO module (portfolio.md §5.2): per-page overrides, redirects manager, sitemap preview. */
export function SeoManager() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("pages");
  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="SEO"
        className="mx-auto flex w-full max-w-4xl gap-1 rounded-lg border bg-surface p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm",
              tab === t.key
                ? "bg-background font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "pages" ? (
        <SingletonEditor config={seoConfig} />
      ) : tab === "redirects" ? (
        <Redirects />
      ) : (
        <SitemapPreview />
      )}
    </div>
  );
}
