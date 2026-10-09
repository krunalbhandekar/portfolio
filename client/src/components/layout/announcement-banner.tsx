"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { Settings } from "@/lib/data/types";

const KEY = "pf-announcement-dismissed";
const EVENT = "pf-announcement-change";

/** Short stable id per announcement text: a new announcement shows again after a dismissal. */
const idOf = (text: string) => {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return String(hash);
};

function read() {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

/**
 * Site-wide announcement (Site Settings → Announcement banner, portfolio.md §4 #15). Hidden
 * after its end date (checked in the browser, since pages are cached) and, when allowed,
 * once the visitor closes it.
 */
export function AnnouncementBanner({ announcement }: { announcement: Settings["announcement"] }) {
  const id = idOf(announcement.text);
  const dismissed = useSyncExternalStore(subscribe, read, () => "") === id;
  const expired = useSyncExternalStore(
    () => () => {},
    () => !!announcement.endsAt && new Date(announcement.endsAt).getTime() < Date.now(),
    () => false,
  );
  if (!announcement.enabled || !announcement.text || expired || dismissed) return null;

  return (
    <div className="relative border-b bg-surface px-10 py-2 text-center text-xs text-muted-foreground print:hidden">
      {announcement.href ? (
        <Link href={announcement.href} className="hover:text-foreground">
          {announcement.text} →
        </Link>
      ) : (
        announcement.text
      )}
      {announcement.dismissible ? (
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={() => {
            try {
              localStorage.setItem(KEY, id);
            } catch {
              // Storage blocked: it will simply show again on the next page.
            }
            window.dispatchEvent(new Event(EVENT));
          }}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 hover:bg-accent hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
