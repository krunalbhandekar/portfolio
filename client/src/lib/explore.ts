"use client";

import { useSyncExternalStore } from "react";
import { mainNav, type NavItem } from "@/config/site";

/*
 * "Explore the site" progress: which main-nav sections this browser has opened. Kept in
 * localStorage only (a per-visitor convenience, nothing is sent anywhere). Reads are wrapped
 * because storage can be blocked (private mode, disabled site data); the UI then simply
 * treats every section as unvisited.
 */

const KEY = "explored-sections";
const EVENT = "explore-change";

let cached: string | null = null;
let snapshot: readonly string[] = [];

function read(): readonly string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw === cached) return snapshot;
  cached = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    snapshot = Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    snapshot = [];
  }
  return snapshot;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The main-nav section a path belongs to (`/projects/foo` → Projects), if any. */
export function sectionFor(pathname: string): NavItem | undefined {
  return mainNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}

/** Records a visit to the section containing `pathname` (no-op for other pages). */
export function markVisited(pathname: string) {
  const section = sectionFor(pathname);
  if (!section) return;
  const visited = read();
  if (visited.includes(section.href)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify([...visited, section.href]));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Visited section hrefs, or `null` on the server and during hydration so server and client
 * markup match (callers render nothing / a neutral state until it's known).
 */
export function useVisited(): readonly string[] | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
