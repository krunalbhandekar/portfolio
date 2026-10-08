/** Shapes returned by the admin API (portfolio.md §9). */

export type ContentStatus = "draft" | "published" | "scheduled";

export type MediaRef = {
  mediaId: string;
  publicId: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  format: string;
  resourceType: "image" | "raw";
};

export type MediaUsage = { resource: string; documentId: string; label?: string };

export type MediaItem = {
  _id: string;
  publicId: string;
  url: string;
  resourceType: "image" | "raw";
  format?: string;
  folder: string;
  bytes?: number;
  width?: number;
  height?: number;
  alt: string;
  originalFilename?: string;
  usedIn: MediaUsage[];
  createdAt: string;
};

export type ContentDoc = {
  _id: string;
  status: ContentStatus;
  order: number;
  slug?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

export type ResourceOption = {
  id: string;
  label: string;
  slug: string | null;
  status: ContentStatus | null;
};

export const toMediaRef = (media: MediaItem): MediaRef => ({
  mediaId: media._id,
  publicId: media.publicId,
  url: media.url,
  alt: media.alt,
  width: media.width ?? null,
  height: media.height ?? null,
  format: media.format ?? "",
  resourceType: media.resourceType,
});
