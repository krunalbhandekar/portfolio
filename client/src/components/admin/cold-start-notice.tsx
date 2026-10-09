"use client";

import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

const DELAY_MS = 4000;

/**
 * Render's free plan sleeps after ~15 idle minutes and takes 30–60s to wake (portfolio.md
 * §13.2). When any admin request has been pending for a few seconds, say so instead of
 * leaving skeletons spinning without explanation.
 */
export function ColdStartNotice() {
  const busy = useIsFetching() + useIsMutating() > 0;
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!busy) {
      const reset = setTimeout(() => setSlow(false), 0);
      return () => clearTimeout(reset);
    }
    const timer = setTimeout(() => setSlow(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [busy]);

  if (!slow || !busy) return null;
  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2.5 rounded-full border bg-popover px-4 py-2 text-sm shadow-lg"
    >
      <LoaderCircle className="size-4 shrink-0 animate-spin text-brand-text" aria-hidden="true" />
      Waking up the server — this can take up to a minute after a quiet period.
    </div>
  );
}
