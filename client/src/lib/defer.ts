/**
 * Runs `task` once the page is no longer busy loading: on the visitor's first interaction
 * (scroll, tap, key) or after `delayMs`, whichever comes first, then in an idle period.
 * For heavy, non-critical work (e.g. Mermaid) that would otherwise block the main thread
 * while the page is becoming interactive.
 */
export function afterFirstInteraction(task: () => void, delayMs = 5500) {
  let done = false;
  const events = ["scroll", "pointerdown", "keydown", "touchstart"] as const;
  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1));
    idle(() => task(), { timeout: 1000 });
  };
  const timer = setTimeout(run, delayMs);
  events.forEach((e) => window.addEventListener(e, run, { once: true, passive: true }));
  function cleanup() {
    clearTimeout(timer);
    events.forEach((e) => window.removeEventListener(e, run));
  }
  return () => {
    done = true;
    cleanup();
  };
}
