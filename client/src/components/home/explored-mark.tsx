"use client";

import { Check } from "lucide-react";
import { useVisited } from "@/lib/explore";

/** "Explored" / "New" badge for a section card; nothing until this visitor's progress is known. */
export function ExploredMark({ href }: { href: string }) {
  const visited = useVisited();
  if (visited === null) return null;
  return visited.includes(href) ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 font-mono text-[10px] text-brand-text">
      <Check className="size-3" strokeWidth={3} aria-hidden="true" /> Explored
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
      <span className="size-1.5 animate-pulse rounded-full bg-brand" aria-hidden="true" /> Not seen
      yet
    </span>
  );
}
