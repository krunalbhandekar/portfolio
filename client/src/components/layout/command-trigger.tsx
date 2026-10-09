"use client";

import { useSyncExternalStore } from "react";
import { Search } from "lucide-react";
import { Kbd } from "@/components/shared/kbd";
import { cn } from "@/lib/utils";
import { OPEN_PALETTE_EVENT } from "@/lib/command-palette-events";

const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Opens the ⌘K command palette (components/layout/command-palette.tsx). */
export function CommandTrigger({ className }: { className?: string }) {
  // "⌘K" on Apple devices, "Ctrl K" elsewhere (server renders ⌘K).
  const mac = useSyncExternalStore(
    () => () => {},
    isMac,
    () => true,
  );
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
      aria-keyshortcuts="Meta+K Control+K"
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-lg border bg-surface px-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <Search className="size-3.5" aria-hidden="true" />
      <span className="hidden lg:inline">Search</span>
      <span className="sr-only lg:hidden">Search</span>
      <Kbd className="hidden lg:inline-flex">{mac ? "⌘K" : "Ctrl K"}</Kbd>
    </button>
  );
}
