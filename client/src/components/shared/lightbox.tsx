"use client";

import { useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type LightboxImage = { src: string; alt: string; width: number; height: number };

type LightboxProps = {
  images: LightboxImage[];
  /** Accessible name for the gallery, e.g. the project title. */
  title: string;
  className?: string;
};

export function Lightbox({ images, title, className }: LightboxProps) {
  const [index, setIndex] = useState<number | null>(null);
  const current = index === null ? null : images[index];

  function step(delta: number) {
    setIndex((i) => (i === null ? i : (i + delta + images.length) % images.length));
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  }

  return (
    <>
      <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}>
        {images.map((image, i) => (
          <li key={image.src}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group block w-full overflow-hidden rounded-xl border bg-surface"
              aria-label={`Open screenshot ${i + 1} of ${images.length}: ${image.alt}`}
            >
              <Image
                src={image.src}
                alt=""
                width={image.width}
                height={image.height}
                sizes="(min-width: 640px) 33vw, 50vw"
                className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={current != null} onOpenChange={(open) => !open && setIndex(null)}>
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
    </>
  );
}
