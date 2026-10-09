"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
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

/** Counts a page view on every client-side navigation (public layout only). */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    track("page_view", { path: pathname });
  }, [pathname]);
  return null;
}
