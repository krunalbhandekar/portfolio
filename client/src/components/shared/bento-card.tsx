"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type BentoCardProps = {
  children: ReactNode;
  className?: string;
  /** Featured cards get a brand-tinted gradient border. */
  featured?: boolean;
};

/** Card with a cursor-following spotlight. Position is written to CSS vars, so no re-renders. */
export function BentoCard({ children, className, featured = false }: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--y", `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      className={cn(
        "group/bento relative isolate overflow-hidden rounded-2xl border bg-card p-5 text-card-foreground transition-colors hover:border-foreground/15 sm:p-6",
        featured &&
          "border-transparent [background:linear-gradient(var(--card),var(--card))_padding-box,linear-gradient(135deg,color-mix(in_oklch,var(--brand)_60%,transparent),var(--border)_45%)_border-box]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/bento:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--x, 50%) var(--y, 50%), var(--spotlight), transparent 45%)",
        }}
      />
      {children}
    </div>
  );
}
