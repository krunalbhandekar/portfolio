"use client";

import { useEffect, useRef, useState } from "react";
import { initials } from "@/lib/initials";
import { cn } from "@/lib/utils";

/** Requests a sharper Google avatar than the default 96px when it's a Google-hosted image. */
const googleSized = (url: string, size: number) => url.replace(/=s\d+(-c)?$/, `=s${size}-c`);

/**
 * Google profile picture for visitor-submitted testimonials (hot-linked, so it uses no
 * Cloudinary storage), falling back to initials when there's none or it fails to load.
 */
export function TestimonialAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // A server-rendered image can fail before hydration, when `onError` isn't attached yet.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  const base = cn("size-10 shrink-0 rounded-full border", className);
  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        className={cn(base, "flex items-center justify-center bg-surface font-mono text-xs")}
      >
        {initials(name)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny external avatar; next/image's Cloudinary loader doesn't apply
    <img
      ref={ref}
      src={googleSized(src, 96)}
      alt=""
      width={40}
      height={40}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn(base, "object-cover")}
    />
  );
}
