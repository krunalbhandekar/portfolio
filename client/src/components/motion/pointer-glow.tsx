"use client";

import { useEffect, useRef } from "react";

const MAX_TILT_DEG = 4;

/**
 * Drop inside a `relative` card (with the `tilt-card` class for tilt) to get a spotlight that
 * follows the cursor and a slight 3D tilt. Pointer position goes to CSS variables on the
 * parent, so nothing re-renders; touch and reduced-motion users get neither.
 */
export function PointerGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = ref.current?.parentElement;
    if (!card || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function move(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !card) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty("--x", `${x * 100}%`);
      card.style.setProperty("--y", `${y * 100}%`);
      card.style.setProperty("--ry", `${(x - 0.5) * 2 * MAX_TILT_DEG}deg`);
      card.style.setProperty("--rx", `${(0.5 - y) * 2 * MAX_TILT_DEG}deg`);
    }
    function leave() {
      card?.style.setProperty("--rx", "0deg");
      card?.style.setProperty("--ry", "0deg");
    }

    card.addEventListener("pointermove", move);
    card.addEventListener("pointerleave", leave);
    return () => {
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
      style={{
        background:
          "radial-gradient(380px circle at var(--x, 50%) var(--y, 50%), color-mix(in oklch, var(--brand) 14%, transparent), transparent 60%)",
      }}
    />
  );
}
