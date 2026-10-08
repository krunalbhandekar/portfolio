"use client";

import { useSyncExternalStore } from "react";

/**
 * `pf_session=1` is a non-secret, JS-readable cookie the API sets alongside the httpOnly auth
 * cookies. It only means "a session probably exists" — used for UI hints (footer link),
 * never for access control. Requires the same-origin /api/v1 proxy (cookie on this domain).
 */
const SESSION_EVENT = "pf-session-change";

export const hasSessionHint = () =>
  typeof document !== "undefined" && /(?:^|;\s*)pf_session=1(?:;|$)/.test(document.cookie);

/** Call after sign-in / sign-out so mounted components re-read the cookie. */
export const notifySessionChange = () => window.dispatchEvent(new Event(SESSION_EVENT));

function subscribe(callback: () => void) {
  window.addEventListener(SESSION_EVENT, callback);
  window.addEventListener("focus", callback);
  return () => {
    window.removeEventListener(SESSION_EVENT, callback);
    window.removeEventListener("focus", callback);
  };
}

export function useSessionHint() {
  return useSyncExternalStore(subscribe, hasSessionHint, () => false);
}
