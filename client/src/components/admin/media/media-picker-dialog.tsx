"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { MediaItem } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { MediaThumb } from "./media-thumb";
import { UploadPanel } from "./upload-panel";

export const mediaKeys = {
  all: ["admin", "media"] as const,
  list: (params: object) => ["admin", "media", "list", params] as const,
  folders: ["admin", "media", "folders"] as const,
};

type MediaPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: MediaItem) => void;
  /** Upload target folder, e.g. "portfolio/projects/trading-platform". */
  folder: string;
  accept?: "image" | "pdf";
};

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  folder,
  accept = "image",
}: MediaPickerDialogProps) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [q, setQ] = useState("");
  const [onlyFolder, setOnlyFolder] = useState(false);
  const params = { kind: accept, q, folder: onlyFolder ? folder : undefined, limit: 60 };

  const media = useQuery({
    queryKey: mediaKeys.list(params),
    queryFn: ({ signal }) => {
      const search = new URLSearchParams({ kind: accept, limit: "60" });
      if (q) search.set("q", q);
      if (onlyFolder) search.set("folder", folder);
      return api.list<MediaItem>(`/admin/media?${search}`, { signal });
    },
    enabled: open && tab === "library",
  });

  const pick = (item: MediaItem) => {
    onSelect(item);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-3xl">
        <div>
          <DialogTitle>{accept === "pdf" ? "Choose a PDF" : "Choose an image"}</DialogTitle>
          <DialogDescription>Pick from the library or upload a new file.</DialogDescription>
        </div>

        <div role="tablist" className="flex gap-1 rounded-lg bg-muted p-1">
          {(["library", "upload"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm capitalize transition-colors",
                tab === value
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>

        {tab === "library" ? (
          <div className="flex min-h-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                className="max-w-xs"
                placeholder="Search alt text or filename"
                value={q}
                onChange={(event) => setQ(event.target.value)}
              />
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={onlyFolder}
                  onChange={(event) => setOnlyFolder(event.target.checked)}
                />
                Only <span className="font-mono">{folder}</span>
              </label>
            </div>
            <div className="min-h-0 overflow-y-auto">
              {media.isPending ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
              ) : media.data?.items.length ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {media.data.items.map((item) => (
                    <li key={item._id}>
                      <button
                        type="button"
                        onClick={() => pick(item)}
                        className="group w-full overflow-hidden rounded-lg border text-left hover:border-ring focus-visible:border-ring"
                      >
                        <MediaThumb item={item} size={240} />
                        <span className="block truncate px-2 py-1.5 text-xs text-muted-foreground group-hover:text-foreground">
                          {item.alt}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <p className="text-sm text-muted-foreground">No files found.</p>
                  <Button type="button" variant="outline" onClick={() => setTab("upload")}>
                    Upload one
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <UploadPanel
            folder={folder}
            accept={accept}
            onUploaded={(item) => {
              void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
              pick(item);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
