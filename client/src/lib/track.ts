import { hasSessionHint } from "./session-hint";

type EventType = "page_view" | "project_view" | "case_study_view" | "post_view" | "resume_download";

/**
 * Fire-and-forget analytics event (portfolio.md §4 #10): no cookies, nothing personal. Skipped
 * for automated browsers, Draft Mode previews and while the admin is signed in, so your own
 * visits don't inflate the numbers.
 */
export function track(type: EventType, data: { refId?: string; path?: string } = {}) {
  if (typeof window === "undefined" || navigator.webdriver) return;
  if (hasSessionHint() || document.querySelector("[data-draft-preview]")) return;
  void fetch("/api/v1/events", {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      path: data.path ?? location.pathname,
      refId: data.refId ?? "",
      referrer: document.referrer,
    }),
  }).catch(() => {});
}
