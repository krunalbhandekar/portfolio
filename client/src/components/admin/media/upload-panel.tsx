"use client";

import { useId, useRef, useState } from "react";
import { LoaderCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IMAGE_ACCEPT, MAX_UPLOAD_BYTES, PDF_ACCEPT, uploadMedia } from "@/lib/admin/media-upload";
import type { MediaItem } from "@/lib/admin/types";
import { formatBytes } from "@/lib/admin/cloudinary";
import { cn } from "@/lib/utils";

type UploadPanelProps = {
  folder: string;
  accept: "image" | "pdf" | "any";
  onUploaded: (media: MediaItem) => void;
};

/** Pick a file, write alt text (required), upload straight to Cloudinary. */
export function UploadPanel({ folder, accept, onUploaded }: UploadPanelProps) {
  const altId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const acceptAttr =
    accept === "image"
      ? IMAGE_ACCEPT
      : accept === "pdf"
        ? PDF_ACCEPT
        : `${IMAGE_ACCEPT},${PDF_ACCEPT}`;
  const isPdfFile = file?.type === "application/pdf";

  const choose = (next: File | undefined) => {
    setError(null);
    if (!next) return;
    if (!acceptAttr.split(",").includes(next.type)) {
      setError(`Unsupported file type (${next.type || "unknown"}).`);
      return;
    }
    if (next.type === "application/pdf" && next.size > MAX_UPLOAD_BYTES) {
      setError("PDFs must be 10 MB or smaller.");
      return;
    }
    setFile(next);
    if (!alt) setAlt(next.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  };

  const upload = async () => {
    if (!file || !alt.trim()) return;
    setError(null);
    setProgress(0);
    try {
      const media = await uploadMedia(file, { folder, alt: alt.trim(), onProgress: setProgress });
      setFile(null);
      setAlt("");
      onUploaded(media);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          choose(event.dataTransfer.files[0]);
        }}
        className={cn(
          "flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center transition-colors hover:bg-accent/50",
          dragging && "border-brand bg-accent/50",
        )}
      >
        <Upload className="size-6 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium">
          {file ? file.name : "Drop a file or click to choose"}
        </span>
        <span className="text-xs text-muted-foreground">
          {file
            ? `${formatBytes(file.size)}${isPdfFile ? "" : " · large images are resized to 2000px WebP before upload"}`
            : accept === "pdf"
              ? "PDF up to 10 MB"
              : "PNG, JPG, WebP, GIF or AVIF up to 10 MB"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => choose(event.target.files?.[0])}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor={altId} className="text-sm font-medium">
          {isPdfFile || accept === "pdf" ? "Title" : "Alt text"}{" "}
          <span className="text-destructive">*</span>
        </label>
        <Input
          id={altId}
          value={alt}
          maxLength={300}
          onChange={(event) => setAlt(event.target.value)}
          placeholder={isPdfFile ? "e.g. Full-stack resume 2026" : "Describe what the image shows"}
        />
        <p className="text-xs text-muted-foreground">
          Uploads to <span className="font-mono">{folder}</span>
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        {progress !== null ? (
          <span className="font-mono text-xs text-muted-foreground tabular-nums" role="status">
            Uploading… {progress}%
          </span>
        ) : null}
        <Button type="button" onClick={upload} disabled={!file || !alt.trim() || progress !== null}>
          {progress !== null ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Upload aria-hidden="true" />
          )}
          Upload
        </Button>
      </div>
    </div>
  );
}
