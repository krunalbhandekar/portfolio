"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type LightboxImage = { src: string; alt: string; width: number; height: number };

type LightboxProps = {
  images: LightboxImage[];
  /** Accessible name for the gallery, e.g. the project title. */
  title: string;
  className?: string;
};

const LightboxViewer = dynamic(() => import("./lightbox-viewer"), { ssr: false });

/** Thumbnail grid; the dialog viewer is fetched on intent (hover/focus) or first click. */
export function Lightbox({ images, title, className }: LightboxProps) {
  const [index, setIndex] = useState<number | null>(null);
  const [requested, setRequested] = useState(false);
  const request = () => setRequested(true);

  return (
    <>
      <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}>
        {images.map((image, i) => (
          <li key={image.src}>
            <button
              type="button"
              onPointerEnter={request}
              onFocus={request}
              onClick={() => {
                request();
                setIndex(i);
              }}
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
      {requested ? (
        <LightboxViewer images={images} title={title} index={index} onIndexChange={setIndex} />
      ) : null}
    </>
  );
}
