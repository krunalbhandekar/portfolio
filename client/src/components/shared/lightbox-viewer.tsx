"use client";

import type { KeyboardEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { LightboxImage } from "./lightbox";

type LightboxViewerProps = {
  images: LightboxImage[];
  title: string;
  index: number | null;
  onIndexChange: (index: number | null) => void;
};

/** The full-screen viewer, loaded on first open by <Lightbox> (keeps the dialog code lazy). */
export default function LightboxViewer({
  images,
  title,
  index,
  onIndexChange,
}: LightboxViewerProps) {
  const current = index === null ? null : images[index];
  const step = (delta: number) =>
    index !== null && onIndexChange((index + delta + images.length) % images.length);
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  };

  return (
    <Dialog open={current != null} onOpenChange={(open) => !open && onIndexChange(null)}>
      <DialogContent onKeyDown={handleKeyDown} className="gap-3 p-3 sm:max-w-4xl">
        {current ? (
          <>
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <Image
              src={current.src}
              alt={current.alt}
              width={current.width}
              height={current.height}
              sizes="(min-width: 896px) 896px, 100vw"
              className="max-h-[75vh] w-full rounded-lg object-contain"
            />
            <div className="flex items-center justify-between gap-3">
              <DialogDescription className="truncate">{current.alt}</DialogDescription>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {(index ?? 0) + 1} / {images.length}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => step(-1)}
                  aria-label="Previous screenshot"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => step(1)}
                  aria-label="Next screenshot"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
