"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 1100;
const NUMBER = /^(\D*)(\d[\d,]*(?:\.\d+)?)(.*)$/;

/**
 * Counts a stat like "5+", "1,200" or "99.9%" up from zero when it scrolls into view. The
 * server renders the final value (no-JS, crawlers); screen readers always get the final value.
 * Non-numeric values and reduced-motion users are left as is.
 */
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const match = NUMBER.exec(value);
    const el = ref.current;
    if (!match || !el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [, prefix, raw, suffix] = match as unknown as [string, string, string, string];
    const target = Number(raw.replace(/,/g, ""));
    const decimals = raw.split(".")[1]?.length ?? 0;
    const grouped = raw.includes(",");
    const format = (n: number) =>
      prefix +
      n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: grouped,
      }) +
      suffix;

    let frame = 0;
    setDisplay(format(0));
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / DURATION_MS, 1);
        const eased = 1 - Math.pow(1 - t, 4);
        setDisplay(t < 1 ? format(target * eased) : value);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref}>
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
