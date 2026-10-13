"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { markVisited } from "@/lib/explore";
import { track } from "@/lib/track";

/** Counts one view of a project/post/case study (dashboard "top projects/posts"). */
export function TrackView({
  type,
  refId,
}: {
  type: "project_view" | "case_study_view" | "post_view";
  refId: string;
}) {
  useEffect(() => {
    track(type, { refId });
  }, [type, refId]);
  return null;
}

/**
 * Counts a page view on every client-side navigation (public layout only), and marks the
 * section as explored for this visitor (lib/explore.ts).
 */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    track("page_view", { path: pathname });
    markVisited(pathname);
  }, [pathname]);
  return null;
}
