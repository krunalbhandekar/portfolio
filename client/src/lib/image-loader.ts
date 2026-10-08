"use client";

type LoaderProps = { src: string; width: number; quality?: number };

// Cloudinary transformation segments look like `e_trim` or `c_fill,w_400`; the version is `v123`.
const isTransformation = (segment: string) =>
  /^[a-z]{1,3}_/.test(segment) && !/^v\d+$/.test(segment);

/**
 * Global next/image loader (portfolio.md §7.4): Cloudinary resizes and picks the format, so
 * Vercel's image-optimisation quota is never used. Other sources pass through unchanged.
 *
 * Resizing is appended after any transformation already in the URL (e.g. `e_trim`), because
 * Cloudinary applies chained transformations in order: trim first, then resize.
 */
export default function imageLoader({ src, width, quality }: LoaderProps) {
  const marker = "/upload/";
  const index = src.indexOf(marker);
  if (!src.includes("res.cloudinary.com") || index === -1) {
    return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
  }
  const head = src.slice(0, index + marker.length);
  const segments = src.slice(index + marker.length).split("/");
  let existing = 0;
  while (existing < segments.length - 1 && isTransformation(segments[existing]!)) existing++;
  const resize = `c_limit,w_${width},q_${quality ?? "auto"},f_auto`;
  return head + [...segments.slice(0, existing), resize, ...segments.slice(existing)].join("/");
}
