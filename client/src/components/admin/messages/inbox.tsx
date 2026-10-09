"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Download,
  Inbox as InboxIcon,
  Mail,
  MailOpen,
  Reply,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useConfirm } from "../kit/confirm-dialog";
import { PageHeader } from "../kit/layout";
import {
  type Box,
  type Message,
  useDeleteMessage,
  useMessages,
  useUpdateMessage,
} from "./use-messages";

const BOXES: { value: Box; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "unread", label: "Unread" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];
const REASONS: Record<string, string> = {
  job: "Job opportunity",
  freelance: "Freelance",
  collaboration: "Collaboration",
  other: "Other",
};

const when = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );

/** Contact inbox (portfolio.md §4 #9): read/unread, archive, delete, reply by email, CSV export. */
export function MessagesInbox() {
  const confirm = useConfirm();
  const [box, setBox] = useState<Box>("inbox");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const list = useMessages(box, q, page);
  const update = useUpdateMessage();
  const remove = useDeleteMessage();

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const items = list.data?.items ?? [];
  const selected = items.find((m) => m._id === selectedId) ?? null;

  const open = (message: Message) => {
    setSelectedId(message._id);
    if (!message.read) update.mutate({ id: message._id, read: true });
  };

  const exportCsv = async () => {
    try {
      await api.get("/auth/me"); // refresh the access cookie before a plain download
      const link = document.createElement("a");
      link.href = "/api/v1/admin/messages/export.csv";
      link.download = "";
      link.click();
    } catch {
      toast.error("Couldn't export — please sign in again");
    }
  };

  const onDelete = async (message: Message) => {
    const ok = await confirm({
      title: `Delete message from ${message.name}?`,
      description: "This can't be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    remove.mutate(message._id, {
      onSuccess: () => {
        toast.success("Message deleted");
        setSelectedId(null);
      },
    });
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Inbox"
        title="Messages"
        description="Messages from the contact form. Opening one marks it as read."
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download aria-hidden="true" /> Export CSV
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Mailbox" className="flex gap-1 rounded-lg bg-muted p-1">
          {BOXES.map((b) => (
            <button
              key={b.value}
              type="button"
              role="tab"
              aria-selected={box === b.value}
              onClick={() => {
                setBox(b.value);
                setPage(1);
                setSelectedId(null);
              }}
              className={cn(
                "rounded-md px-3 py-1 text-sm",
                box === b.value
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Search messages"
            className="pl-8"
            placeholder="Search name, email, text…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid min-h-[420px] gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="overflow-hidden rounded-2xl border bg-card">
          {list.isPending ? (
            <div className="flex flex-col gap-3 p-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              className="m-4"
              icon={InboxIcon}
              title={q ? "No messages match" : "Nothing here"}
              description={box === "inbox" ? "New contact-form messages appear here." : undefined}
            />
          ) : (
            <ul className="divide-y">
              {items.map((m) => (
                <li key={m._id}>
                  <button
                    type="button"
                    onClick={() => open(m)}
                    aria-current={m._id === selectedId ? "true" : undefined}
                    className={cn(
                      "flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-accent/50",
                      m._id === selectedId && "bg-accent",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {!m.read ? (
                        <span
                          className="size-2 shrink-0 rounded-full bg-brand"
                          aria-label="Unread"
                        />
                      ) : null}
                      <span className={cn("truncate text-sm", !m.read && "font-semibold")}>
                        {m.name}
                      </span>
                      <span className="ml-auto shrink-0 font-mono text-[0.7rem] text-muted-foreground">
                        {when(m.createdAt)}
                      </span>
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {m.subject || REASONS[m.reason ?? ""] || "No subject"} — {m.message}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {list.data && list.data.meta.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
              <span>
                Page {list.data.meta.page} of {list.data.meta.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= list.data.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border bg-card p-6">
          {selected ? (
            <article className="flex h-full flex-col gap-5">
              <header className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">
                  {selected.subject || REASONS[selected.reason ?? ""] || "No subject"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground">{selected.name}</span> &lt;{selected.email}&gt;
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {when(selected.createdAt)} · {REASONS[selected.reason ?? ""] ?? "Other"}
                  {selected.emailed === false ? " · email notification failed" : ""}
                </p>
              </header>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              <div className="mt-auto flex flex-wrap gap-2 border-t pt-4">
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject || "Your message"}`)}`}
                  className={buttonVariants()}
                >
                  <Reply aria-hidden="true" /> Reply by email
                </a>
                <Button
                  variant="outline"
                  onClick={() => update.mutate({ id: selected._id, read: !selected.read })}
                >
                  {selected.read ? <Mail aria-hidden="true" /> : <MailOpen aria-hidden="true" />}
                  {selected.read ? "Mark unread" : "Mark read"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    update.mutate(
                      { id: selected._id, archived: !selected.archived },
                      {
                        onSuccess: () =>
                          toast.success(selected.archived ? "Moved to inbox" : "Archived"),
                      },
                    )
                  }
                >
                  {selected.archived ? (
                    <ArchiveRestore aria-hidden="true" />
                  ) : (
                    <Archive aria-hidden="true" />
                  )}
                  {selected.archived ? "Unarchive" : "Archive"}
                </Button>
                <Button variant="ghost" onClick={() => onDelete(selected)}>
                  <Trash2 aria-hidden="true" /> Delete
                </Button>
              </div>
            </article>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Select a message to read it.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
