"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { m, useMotionValue, useSpring } from "motion/react";

const SPRING = { stiffness: 220, damping: 16, mass: 0.4 };

/**
 * Pulls its child a few pixels towards the pointer and springs back on leave. Fine pointers
 * only (no effect on touch); MotionConfig turns it off for reduced motion.
 */
export function Magnetic({
  children,
  strength = 0.25,
}: {
  children: ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);

  function handleMove(event: PointerEvent<HTMLSpanElement>) {
    if (event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <m.span
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{ x, y }}
      className="inline-flex"
    >
      {children}
    </m.span>
  );
}
