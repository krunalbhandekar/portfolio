/**
 * Inserts a Cloudinary transformation into a delivery URL, e.g.
 * cldUrl(url, "c_fill,w_400,h_300") → …/upload/c_fill,w_400,h_300,f_auto,q_auto/…
 * (portfolio.md §7.4: always f_auto,q_auto with a width).
 */
export function cldUrl(url: string, transform: string) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform},f_auto,q_auto/`);
}

export const isPdf = (item: { format?: string | null }) => item.format === "pdf";

export function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
