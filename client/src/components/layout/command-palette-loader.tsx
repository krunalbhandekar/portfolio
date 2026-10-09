"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { isPaletteShortcut, OPEN_PALETTE_EVENT } from "@/lib/command-palette-events";

const CommandPalette = dynamic(() => import("./command-palette"), { ssr: false });

/**
 * Keeps the palette out of the initial bundle: only the shortcut listener ships with every
 * page; the palette loads (and opens) the first time it's asked for.
 */
export function CommandPaletteLoader() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    const onKey = (e: KeyboardEvent) => {
      if (!isPaletteShortcut(e)) return;
      e.preventDefault();
      setLoaded(true);
    };
    const onOpen = () => setLoaded(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, [loaded]);

  return loaded ? <CommandPalette defaultOpen /> : null;
}
