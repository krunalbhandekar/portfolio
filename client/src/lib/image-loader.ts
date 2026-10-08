"use client";

type LoaderProps = { src: string; width: number; quality?: number };

/**
 * Global next/image loader (portfolio.md §7.4): Cloudinary resizes and picks the format, so
 * Vercel's image-optimisation quota is never used. Other sources pass through unchanged.
 */
export default function imageLoader({ src, width, quality }: LoaderProps) {
  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    return src.replace("/upload/", `/upload/c_limit,w_${width},q_${quality ?? "auto"},f_auto/`);
  }
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}
