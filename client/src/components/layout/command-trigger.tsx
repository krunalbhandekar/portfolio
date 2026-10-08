"use client";

import { Search } from "lucide-react";
import { Kbd } from "@/components/shared/kbd";
import { cn } from "@/lib/utils";

/**
 * Opens the ⌘K command palette. The palette itself ships in Phase 6
 * (portfolio.md §15); until then the trigger is visible but inert.
 */
export function CommandTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-disabled="true"
      title="Search — coming soon"
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-lg border bg-surface px-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <Search className="size-3.5" aria-hidden="true" />
      <span className="hidden lg:inline">Search</span>
      <span className="sr-only lg:hidden">Search</span>
      <Kbd className="hidden lg:inline-flex">⌘K</Kbd>
    </button>
  );
}
