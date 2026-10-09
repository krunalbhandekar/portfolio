import { cn } from "@/lib/utils";

/**
 * Inline images come from Cloudinary (the API only allows our own account): request a
 * resized, auto-format/quality version and load it lazily, without changing stored HTML.
 */
function optimizeImages(html: string) {
  if (!html.includes("<img")) return html;
  return html.replace(/<img\b([^>]*)>/g, (_, attrs: string) => {
    const src = attrs.replace(
      /src="(https:\/\/res\.cloudinary\.com\/[^"]+?\/upload\/)([^"]+)"/,
      (_m, head: string, rest: string) => `src="${head}c_limit,w_1600,q_auto,f_auto/${rest}"`,
    );
    return `<img loading="lazy" decoding="async"${src}>`;
  });
}

/** Renders CMS rich text. Safe: the API sanitises it against an allow-list on save. */
export function RichText({ html, className }: { html: string; className?: string }) {
  if (!html) return null;
  return (
    <div
      className={cn("rich-text", className)}
      dangerouslySetInnerHTML={{ __html: optimizeImages(html) }}
    />
  );
}
