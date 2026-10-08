import { cn } from "@/lib/utils";

/** Renders CMS rich text. Safe: the API sanitises it against an allow-list on save. */
export function RichText({ html, className }: { html: string; className?: string }) {
  if (!html) return null;
  return <div className={cn("rich-text", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
