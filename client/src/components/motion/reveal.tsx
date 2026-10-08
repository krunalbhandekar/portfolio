"use client";

import { Children, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Scroll reveals without an animation library: an IntersectionObserver flips `data-revealed`
 * and CSS does the transition (globals.css, `[data-reveal]`). Content is only hidden once JS
 * has run (`html.js`), so it's never invisible without JavaScript, and reduced-motion users
 * see it immediately. Don't wrap above-the-fold content (it would delay LCP).
 */

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.dataset.revealed = "true";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

type RevealProps = { children: ReactNode; className?: string; delay?: number };

/** Fades + slides content in once when it scrolls into view. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-reveal=""
      className={className}
      style={delay ? ({ "--reveal-delay": `${delay}s` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

/** Reveals its <StaggerItem> children one after another. */
export function Stagger({
  children,
  className,
  gap = 0.06,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} data-reveal-group="" className={className}>
      {Children.map(children, (child, index) => (
        <div style={{ "--reveal-delay": `${index * gap}s` } as CSSProperties} className="contents">
          {child}
        </div>
      ))}
    </div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-reveal-item="" className={cn(className)}>
      {children}
    </div>
  );
}
