"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ExternalLink, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { formatBytes } from "@/lib/admin/cloudinary";
import type { MediaItem, MediaUsage } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { useConfirm } from "../kit/confirm-dialog";
import { selectClass } from "../kit/fields";
import { PageHeader } from "../kit/layout";
import { mediaKeys } from "./media-picker-dialog";
import { MediaThumb } from "./media-thumb";
import { UploadPanel } from "./upload-panel";

const UPLOAD_FOLDERS = [
  "portfolio/general",
  "portfolio/brand",
  "portfolio/about",
  "portfolio/companies",
  "portfolio/certificates",
  "portfolio/resumes",
  "portfolio/projects",
];

const usageLabel = (u: MediaUsage) => `${u.resource}${u.label ? ` › ${u.label}` : ""}`;

function MediaDetails({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [alt, setAlt] = useState(item.alt);
  const [blockedBy, setBlockedBy] = useState<MediaUsage[] | null>(null);

  const saveAlt = useMutation({
    mutationFn: () => api.patch<MediaItem>(`/admin/media/${item._id}`, { alt }),
    onSuccess: () => {
      toast.success("Alt text saved");
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
    onError: (err) => toast.error("Couldn't save", { description: err.message }),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/admin/media/${item._id}`),
    onSuccess: () => {
      toast.success("Deleted from the library and Cloudinary");
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "MEDIA_IN_USE") {
        setBlockedBy((err.details as { usedIn: MediaUsage[] }).usedIn);
      } else toast.error("Couldn't delete", { description: err.message });
    },
  });

  const onDelete = async () => {
    if (item.usedIn.length) {
      setBlockedBy(item.usedIn);
      return;
    }
    if (
      await confirm({
        title: "Delete this file?",
        description: "It will be removed from Cloudinary too.",
        confirmLabel: "Delete",
        destructive: true,
      })
    ) {
      remove.mutate();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border">
        <MediaThumb item={item} size={800} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt className="text-muted-foreground">Folder</dt>
        <dd className="truncate font-mono">{item.folder}</dd>
        <dt className="text-muted-foreground">File</dt>
        <dd className="truncate">{item.originalFilename || item.publicId}</dd>
        <dt className="text-muted-foreground">Size</dt>
        <dd>
          {formatBytes(item.bytes)}
          {item.width ? ` · ${item.width}×${item.height}` : ""} · {item.format}
        </dd>
        <dt className="text-muted-foreground">Used in</dt>
        <dd>{item.usedIn.length ? item.usedIn.map(usageLabel).join(", ") : "Not used"}</dd>
      </dl>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="media-alt" className="text-sm font-medium">
          Alt text
        </label>
        <div className="flex gap-2">
          <Input
            id="media-alt"
            value={alt}
            maxLength={300}
            onChange={(event) => setAlt(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={!alt.trim() || alt === item.alt || saveAlt.isPending}
            onClick={() => saveAlt.mutate()}
          >
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Default alt for new uses; existing uses keep their own copy.
        </p>
      </div>
      {blockedBy ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm"
        >
          <p className="font-medium">Can&apos;t delete: this file is still used in</p>
          <ul className="mt-1 list-disc pl-5 text-muted-foreground">
            {blockedBy.map((u) => (
              <li key={`${u.resource}-${u.documentId}`}>{usageLabel(u)}</li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted-foreground">Remove it from those items first.</p>
        </div>
      ) : null}
      <div className="flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              navigator.clipboard.writeText(item.url).then(() => toast.success("URL copied"))
            }
          >
            <Copy aria-hidden="true" /> Copy URL
          </Button>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-[0.8rem] text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" /> Open
          </a>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={remove.isPending}
        >
          <Trash2 aria-hidden="true" /> Delete
        </Button>
      </div>
    </div>
  );
}

export function MediaLibrary() {
  const queryClient = useQueryClient();
  const [folder, setFolder] = useState("");
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState(UPLOAD_FOLDERS[0]!);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const params = { folder, kind, q: debouncedQ, page };
  const media = useQuery({
    queryKey: mediaKeys.list(params),
    queryFn: ({ signal }) => {
      const search = new URLSearchParams({ page: String(page), limit: "40" });
      if (folder) search.set("folder", folder);
      if (kind) search.set("kind", kind);
      if (debouncedQ) search.set("q", debouncedQ);
      return api.list<MediaItem>(`/admin/media?${search}`, { signal });
    },
  });
  const folders = useQuery({
    queryKey: mediaKeys.folders,
    queryFn: () => api.get<string[]>("/admin/media/folders"),
  });

  // Keep the open details panel in sync after edits.
  const current = selected
    ? (media.data?.items.find((m) => m._id === selected._id) ?? selected)
    : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Content"
        title="Media library"
        description="Images and PDFs on Cloudinary. Files in use can't be deleted."
        actions={
          <Button onClick={() => setUploading(true)}>
            <Upload aria-hidden="true" /> Upload
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          aria-label="Search media"
          className="max-w-xs"
          placeholder="Search alt text or filename"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Filter by folder"
          className={cn(selectClass, "w-56")}
          value={folder}
          onChange={(e) => {
            setFolder(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All folders</option>
          {folders.data?.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by type"
          className={cn(selectClass, "w-32")}
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All types</option>
          <option value="image">Images</option>
          <option value="pdf">PDFs</option>
        </select>
      </div>

      {media.isPending ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-xl" />
          ))}
        </div>
      ) : media.isError ? (
        <p className="text-sm text-destructive">{media.error.message}</p>
      ) : media.data.items.length === 0 ? (
        <EmptyState
          title="No files yet"
          description="Upload screenshots, logos and resume PDFs."
          action={
            <Button variant="outline" onClick={() => setUploading(true)}>
              Upload
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {media.data.items.map((item) => (
            <li key={item._id}>
              <button
                type="button"
                onClick={() => setSelected(item)}
                className="group w-full overflow-hidden rounded-xl border bg-card text-left hover:border-ring"
              >
                <MediaThumb item={item} size={320} />
                <span className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="truncate text-xs">{item.alt}</span>
                  {item.usedIn.length ? (
                    <span className="shrink-0 rounded-full bg-muted px-1.5 font-mono text-[0.65rem] text-muted-foreground">
                      in use
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {media.data && media.data.meta.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="font-mono text-xs text-muted-foreground">
            Page {media.data.meta.page} of {media.data.meta.totalPages}
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
              disabled={page >= media.data.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={current !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogTitle className="truncate pr-8">{current?.alt}</DialogTitle>
          <DialogDescription className="sr-only">File details</DialogDescription>
          {current ? (
            <MediaDetails key={current._id} item={current} onClose={() => setSelected(null)} />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={uploading} onOpenChange={setUploading}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle>Upload</DialogTitle>
          <DialogDescription>
            Files go straight to Cloudinary; this server only stores the details.
          </DialogDescription>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Folder
            <select
              className={selectClass}
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value)}
            >
              {UPLOAD_FOLDERS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <UploadPanel
            folder={uploadFolder}
            accept="any"
            onUploaded={() => {
              toast.success("Uploaded");
              setUploading(false);
              void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
