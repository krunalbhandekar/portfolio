import { api } from "@/lib/api";
import type { MediaItem } from "./types";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // Cloudinary free plan
const MAX_DIMENSION = 2000;
const COMPRESSIBLE = new Set(["image/jpeg", "image/png", "image/webp"]);

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";
export const PDF_ACCEPT = "application/pdf";

type Signature = {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
};

/**
 * Resizes large screenshots to ≤2000px and re-encodes as WebP (portfolio.md §7.3) to save
 * Cloudinary storage. GIFs (animation), PDFs and already-small files are left untouched.
 */
export async function compressImage(file: File): Promise<File> {
  if (!COMPRESSIBLE.has(file.type)) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 400 * 1024) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.82),
  );
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
}

function uploadToCloudinary(file: File, sig: Signature, onProgress?: (percent: number) => void) {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  form.append("allowed_formats", sig.allowedFormats);

  // XHR (not fetch) for upload progress events.
  return new Promise<{ public_id: string; resource_type: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", sig.uploadUrl);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      const body = JSON.parse(xhr.responseText || "{}");
      if (xhr.status >= 200 && xhr.status < 300) resolve(body);
      else reject(new Error(body?.error?.message ?? `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Upload failed: network error"));
    xhr.send(form);
  });
}

/**
 * compress → signed direct upload to Cloudinary (never through Render) → register metadata.
 */
export async function uploadMedia(
  file: File,
  {
    folder,
    alt,
    onProgress,
  }: { folder: string; alt: string; onProgress?: (percent: number) => void },
) {
  const prepared = await compressImage(file);
  if (prepared.size > MAX_UPLOAD_BYTES) throw new Error("File is larger than 10 MB");

  const signature = await api.post<Signature>("/admin/media/signature", { folder });
  const uploaded = await uploadToCloudinary(prepared, signature, onProgress);
  return api.post<MediaItem>("/admin/media", {
    publicId: uploaded.public_id,
    resourceType: uploaded.resource_type === "raw" ? "raw" : "image",
    folder,
    alt,
    originalFilename: file.name.slice(0, 200),
  });
}
