/** Fired by the navbar search button; the palette (or its loader) listens for it. */
export const OPEN_PALETTE_EVENT = "open-command-palette";

/** ⌘K / Ctrl+K anywhere, or "/" when not typing in a field. */
export function isPaletteShortcut(e: KeyboardEvent) {
  if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) return true;
  const typing =
    e.target instanceof HTMLElement &&
    (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
  return e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey;
}
