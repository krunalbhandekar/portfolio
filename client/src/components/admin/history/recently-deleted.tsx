"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArchiveRestore, LoaderCircle, RotateCcw } from "lucide-react";
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
import { formatWhen, type RevisionSummary } from "./revision-history";

/** Deleted items of a collection, restorable with their original id and URL. */
export function RecentlyDeleted({ resource, title }: { resource: string; title: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const deleted = useQuery({
    queryKey: ["admin", "revisions", "deleted", resource],
    queryFn: ({ signal }) =>
      api.get<RevisionSummary[]>(
        `/admin/revisions/deleted?resource=${encodeURIComponent(resource)}`,
        { signal },
      ),
    enabled: open,
  });
  const restore = useMutation({
    mutationFn: (id: string) => api.post(`/admin/revisions/${id}/restore`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Restored");
    },
    onError: (err) => toast.error("Couldn't restore", { description: err.message }),
  });

  return (
    <>
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
        <ArchiveRestore aria-hidden="true" /> Recently deleted
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>Recently deleted · {title}</SheetTitle>
            <SheetDescription>
              Restoring brings the item back exactly as it was when deleted (status included).
            </SheetDescription>
          </SheetHeader>
          <ul className="flex flex-col overflow-y-auto">
            {deleted.isPending ? (
              <li className="p-4">
                <Skeleton className="h-16 w-full" />
              </li>
            ) : deleted.data?.length ? (
              deleted.data.map((r) => (
                <li
                  key={r._id}
                  className="flex items-center justify-between gap-3 border-b px-4 py-3"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{r.label || "Untitled"}</span>
                    <span className="text-xs text-muted-foreground">
                      Deleted {formatWhen(r.createdAt)}
                    </span>
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={restore.isPending}
                    onClick={() => restore.mutate(r._id)}
                  >
                    {restore.isPending && restore.variables === r._id ? (
                      <LoaderCircle className="animate-spin" aria-hidden="true" />
                    ) : (
                      <RotateCcw aria-hidden="true" />
                    )}
                    Restore
                  </Button>
                </li>
              ))
            ) : (
              <li className="p-4 text-sm text-muted-foreground">Nothing deleted recently.</li>
            )}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
