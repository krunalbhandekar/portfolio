import Image from "next/image";
import { FileText } from "lucide-react";
import { cldUrl, isPdf } from "@/lib/admin/cloudinary";
import { cn } from "@/lib/utils";

/** Small preview for an uploaded image (Cloudinary-resized) or a PDF icon. */
export function MediaThumb({
  item,
  className,
  size = 320,
}: {
  item: { url: string; alt: string; format?: string | null };
  className?: string;
  size?: number;
}) {
  if (isPdf(item)) {
    return (
      <div className={cn("flex aspect-video items-center justify-center bg-muted", className)}>
        <FileText className="size-8 text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">PDF: {item.alt}</span>
      </div>
    );
  }
  return (
    <Image
      src={cldUrl(item.url, `c_fill,w_${size},h_${Math.round((size * 9) / 16)}`)}
      alt={item.alt}
      width={size}
      height={Math.round((size * 9) / 16)}
      unoptimized
      className={cn("aspect-video w-full bg-muted object-cover", className)}
    />
  );
}
