"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDownUp,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteResource,
  usePublishResource,
  useReorderResource,
  useResourceList,
} from "@/lib/admin/resource-api";
import type { ContentDoc } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { useConfirm } from "../kit/confirm-dialog";
import { selectClass } from "../kit/fields";
import { formatWhen } from "../history/revision-history";
import { RecentlyDeleted } from "../history/recently-deleted";
import { PageHeader, StatusPill } from "../kit/layout";
import type { ResourceConfig } from "./types";

const PAGE_SIZE = 20;

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}

function SortableRow({
  id,
  children,
  enabled,
}: {
  id: string;
  children: React.ReactNode;
  enabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !enabled,
  });
  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("border-b last:border-0", isDragging && "relative z-10 bg-accent")}
    >
      {enabled ? (
        <td className="w-8 pl-3">
          <button
            type="button"
            aria-label="Drag to reorder"
            className="cursor-grab rounded p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
        </td>
      ) : null}
      {children}
    </tr>
  );
}

export function ResourceList({ config }: { config: ResourceConfig }) {
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [reordering, setReordering] = useState(false);
  const q = useDebounced(search);

  // Reorder mode shows everything in manual order, unfiltered.
  const params = reordering ? { limit: 100 } : { page, limit: PAGE_SIZE, q, status, sort };
  const list = useResourceList(config.apiPath, params);
  const remove = useDeleteResource(config.apiPath);
  const publish = usePublishResource(config.apiPath);
  const reorder = useReorderResource(config.apiPath);

  const [order, setOrder] = useState<ContentDoc[] | null>(null);
  const rows = useMemo(
    () => (reordering && order ? order : (list.data?.items ?? [])),
    [reordering, order, list.data],
  );
  const meta = list.data?.meta;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const current = order ?? list.data?.items ?? [];
    const next = arrayMove(
      current,
      current.findIndex((d) => d._id === active.id),
      current.findIndex((d) => d._id === over.id),
    );
    setOrder(next);
    reorder.mutate(
      next.map((d) => d._id),
      { onError: (err) => toast.error("Couldn't save order", { description: err.message }) },
    );
  };

  const toggleSort = (key: string) => {
    setPage(1);
    setSort((current) => (current === key ? `-${key}` : current === `-${key}` ? "" : key));
  };

  const labelOf = (doc: ContentDoc) => String(doc[config.labelField] ?? config.singular);

  const onDelete = async (doc: ContentDoc) => {
    const ok = await confirm({
      title: `Delete “${labelOf(doc)}”?`,
      description: "This can't be undone. Images it uses stay in the media library.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    remove.mutate(doc._id, {
      onSuccess: () => toast.success(`${config.singular} deleted`),
      onError: (err) => toast.error("Couldn't delete", { description: err.message }),
    });
  };

  const onTogglePublish = (doc: ContentDoc) =>
    publish.mutate(
      { id: doc._id, publish: doc.status !== "published" },
      {
        onSuccess: (saved) =>
          toast.success(saved.status === "published" ? "Published" : "Moved to drafts"),
        onError: (err) => toast.error("Couldn't change status", { description: err.message }),
      },
    );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Content"
        title={config.title}
        description={config.description}
        actions={
          <>
            <Button
              variant={reordering ? "default" : "outline"}
              onClick={() => {
                setReordering((value) => !value);
                setOrder(null);
              }}
            >
              <ArrowDownUp aria-hidden="true" />
              {reordering ? "Done" : "Reorder"}
            </Button>
            <RecentlyDeleted resource={config.apiPath} title={config.title} />
            <Link href={`/admin/${config.key}/new`} className={buttonVariants()}>
              <Plus aria-hidden="true" /> New {config.singular.toLowerCase()}
            </Link>
          </>
        }
      />

      {reordering ? (
        <p className="rounded-xl border bg-surface px-4 py-3 text-sm text-muted-foreground">
          Drag rows (or focus a handle and use Space + arrow keys) to set the order shown on the
          site.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search
              className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              aria-label={`Search ${config.title.toLowerCase()}`}
              className="pl-8"
              placeholder="Search…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="Filter by status"
            className={cn(selectClass, "w-36")}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border bg-card">
        {list.isPending ? (
          <div className="flex flex-col gap-3 p-5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : list.isError ? (
          <p className="p-6 text-sm text-destructive">{list.error.message}</p>
        ) : rows.length === 0 ? (
          <EmptyState
            className="border-0"
            title={
              q || status ? "Nothing matches your filters" : `No ${config.title.toLowerCase()} yet`
            }
            description={
              q || status
                ? "Try a different search or status."
                : `Create your first ${config.singular.toLowerCase()}.`
            }
            action={
              q || status ? null : (
                <Link
                  href={`/admin/${config.key}/new`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <Plus aria-hidden="true" /> New {config.singular.toLowerCase()}
                </Link>
              )
            }
          />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left font-mono text-xs tracking-wide text-muted-foreground uppercase">
                  {reordering ? <th className="w-8" /> : null}
                  {config.columns.map((column) => (
                    <th
                      key={column.header}
                      className={cn("px-4 py-3 font-normal", column.className)}
                    >
                      {column.sortKey && !reordering ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                          onClick={() => toggleSort(column.sortKey!)}
                          aria-label={`Sort by ${column.header}`}
                        >
                          {column.header}
                          {sort === column.sortKey ? (
                            <ChevronUp className="size-3" />
                          ) : sort === `-${column.sortKey}` ? (
                            <ChevronDown className="size-3" />
                          ) : null}
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 text-right font-normal">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <SortableContext
                  items={rows.map((r) => r._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {rows.map((doc) => (
                    <SortableRow key={doc._id} id={doc._id} enabled={reordering}>
                      {config.columns.map((column, index) => (
                        <td
                          key={column.header}
                          className={cn("px-4 py-3 align-middle", column.className)}
                        >
                          {index === 0 ? (
                            <Link
                              href={`/admin/${config.key}/${doc._id}`}
                              className="font-medium hover:underline"
                            >
                              {column.cell(doc)}
                            </Link>
                          ) : (
                            column.cell(doc)
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onTogglePublish(doc)}
                          disabled={publish.isPending}
                          title={
                            doc.status === "published"
                              ? "Click to unpublish"
                              : doc.status === "scheduled" && doc.publishAt
                                ? `Scheduled for ${formatWhen(String(doc.publishAt))} — click to publish now`
                                : "Click to publish"
                          }
                          className="rounded-full"
                        >
                          <StatusPill status={doc.status} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/admin/${config.key}/${doc._id}`}
                            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                            aria-label={`Edit ${labelOf(doc)}`}
                          >
                            <Pencil />
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${labelOf(doc)}`}
                            onClick={() => onDelete(doc)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </SortableRow>
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        )}
      </div>

      {!reordering && meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-mono text-xs">
            Page {meta.page} of {meta.totalPages} · {meta.total} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
