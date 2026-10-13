"use client";

import Link from "next/link";
import { Popover } from "@base-ui/react/popover";
import { ArrowRight, Check, Compass, PartyPopper } from "lucide-react";
import { m } from "motion/react";
import { mainNav } from "@/config/site";
import { useVisited } from "@/lib/explore";
import { cn } from "@/lib/utils";

const R = 13;
const CIRCUMFERENCE = 2 * Math.PI * R;

/** Ring that fills as sections are explored, with the count in the middle. */
function Ring({ done, total }: { done: number; total: number }) {
  const complete = done === total;
  return (
    <svg viewBox="0 0 32 32" className="size-8 -rotate-90" aria-hidden="true">
      <circle cx="16" cy="16" r={R} fill="none" strokeWidth="2.5" className="stroke-border" />
      <m.circle
        cx="16"
        cy="16"
        r={R}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="stroke-brand"
        strokeDasharray={CIRCUMFERENCE}
        initial={false}
        animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - done / total) }}
      />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        dominantBaseline="central"
        className={cn(
          "rotate-90 fill-foreground font-mono text-[9px] font-semibold",
          complete && "fill-brand",
        )}
        style={{ transformOrigin: "16px 16px" }}
      >
        {complete ? "✓" : done}
      </text>
    </svg>
  );
}

/**
 * "Explored 3/7": a progress ring in the navbar that opens a checklist of every main section,
 * pointing at the next unexplored one. Progress lives in this browser only (lib/explore.ts).
 */
export function ExploreProgress() {
  const visited = useVisited();
  const total = mainNav.length;
  // Same-size slot until progress is known, so the navbar never shifts.
  if (visited === null) return <span className="size-8" aria-hidden="true" />;

  const done = mainNav.filter((item) => visited.includes(item.href)).length;
  const next = mainNav.find((item) => !visited.includes(item.href));

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`Site explored: ${done} of ${total} sections`}
        className="inline-flex size-8 items-center justify-center rounded-full transition-transform hover:scale-110 data-popup-open:scale-110"
      >
        <Ring done={done} total={total} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={10} className="isolate z-50">
          <Popover.Popup className="w-80 origin-(--transform-origin) rounded-2xl border bg-popover p-4 text-popover-foreground shadow-2xl shadow-black/20 transition-[opacity,scale] duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand-text">
                {next ? (
                  <Compass className="size-4.5" aria-hidden="true" />
                ) : (
                  <PartyPopper className="size-4.5" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <Popover.Title className="text-sm font-semibold">
                  {next ? "Explore the site" : "You've seen it all"}
                </Popover.Title>
                <Popover.Description className="mt-0.5 text-xs text-muted-foreground">
                  {next
                    ? `${done} of ${total} sections explored. Each one has something different.`
                    : "Thanks for looking around. If you liked what you saw, let's talk."}
                </Popover.Description>
              </div>
            </div>

            <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
              <m.div
                className="h-full rounded-full bg-gradient-to-r from-brand/60 to-brand"
                initial={{ width: 0 }}
                animate={{ width: `${(done / total) * 100}%` }}
              />
            </div>

            <ul className="mt-3 flex flex-col">
              {mainNav.map((item, i) => {
                const seen = visited.includes(item.href);
                return (
                  <m.li
                    key={item.href}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Popover.Close
                      nativeButton={false}
                      render={<Link href={item.href} />}
                      className={cn(
                        "group/item flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                        item === next && "bg-brand/10 hover:bg-brand/15",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                          seen ? "border-brand bg-brand text-brand-foreground" : "border-dashed",
                        )}
                        aria-hidden="true"
                      >
                        {seen ? <Check className="size-3" strokeWidth={3} /> : null}
                      </span>
                      <span className={cn("flex-1", seen && "text-muted-foreground")}>
                        {item.label}
                        <span className="sr-only">
                          {seen ? " (explored)" : " (not explored yet)"}
                        </span>
                      </span>
                      {item === next ? (
                        <span className="font-mono text-[10px] tracking-wider text-brand-text uppercase">
                          Next
                        </span>
                      ) : (
                        <ArrowRight
                          className="size-3.5 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover/item:translate-x-0 group-hover/item:opacity-100"
                          aria-hidden="true"
                        />
                      )}
                    </Popover.Close>
                  </m.li>
                );
              })}
            </ul>

            {next ? (
              <p className="mt-3 border-t pt-3 text-xs text-pretty text-muted-foreground">
                <span className="font-medium text-foreground">{next.label}:</span> {next.teaser}
              </p>
            ) : (
              <Popover.Close
                nativeButton={false}
                render={<Link href="/contact" />}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Get in touch <ArrowRight className="size-3.5" aria-hidden="true" />
              </Popover.Close>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
