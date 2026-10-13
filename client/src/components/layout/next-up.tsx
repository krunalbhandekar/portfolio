"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { BentoCard } from "@/components/shared/bento-card";
import { mainNav } from "@/config/site";
import { sectionFor, useVisited } from "@/lib/explore";
import { cn } from "@/lib/utils";

/**
 * "Up next" teaser above the footer: leads the visitor through the main sections in nav order
 * (Projects → Case Studies → … → Contact), and lists what they haven't explored yet. Pages
 * outside the main nav (home, skills, resume…) point at the first unexplored section.
 */
function NextUpCard() {
  const pathname = usePathname();
  const visited = useVisited();
  const current = sectionFor(pathname);
  const unexplored = mainNav.filter(
    (item) => item !== current && !(visited ?? []).includes(item.href),
  );

  const index = current ? mainNav.indexOf(current) : -1;
  const next =
    index >= 0 && index < mainNav.length - 1
      ? mainNav[index + 1]
      : (unexplored[0] ?? (current ? undefined : mainNav[0]));
  // Home has its own "Explore" grid.
  if (!next || pathname === "/") return null;

  const position = mainNav.indexOf(next) + 1;
  const others = unexplored.filter((item) => item !== next).slice(0, 4);

  return (
    <section aria-labelledby="next-up" className="container-page mt-16 print:hidden">
      <Reveal>
        <BentoCard featured className="p-0 sm:p-0">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
            <div className="flex max-w-xl flex-col gap-3">
              <p className="font-mono text-xs tracking-widest text-brand-text uppercase">
                Up next{" "}
                <span className="text-muted-foreground">
                  · {String(position).padStart(2, "0")} / {String(mainNav.length).padStart(2, "0")}
                </span>
              </p>
              <h2 id="next-up" className="text-3xl font-semibold tracking-tight sm:text-4xl">
                <Link
                  href={next.href}
                  className="group/next text-gradient-hover after:absolute after:inset-0"
                >
                  {next.label}
                  <ArrowRight
                    className="ml-2 inline size-7 align-[-0.1em] text-brand-text transition-transform duration-300 group-hover/next:translate-x-1.5"
                    aria-hidden="true"
                  />
                </Link>
              </h2>
              <p className="text-pretty text-muted-foreground">{next.teaser}</p>
            </div>

            <ol aria-label="Tour progress" className="flex gap-1.5">
              {mainNav.map((item) => {
                const seen = (visited ?? []).includes(item.href) || item === current;
                return (
                  <li
                    key={item.href}
                    title={item.label}
                    className={cn(
                      "h-1.5 w-6 rounded-full transition-colors",
                      item === next ? "animate-pulse bg-brand" : seen ? "bg-brand/50" : "bg-muted",
                    )}
                  >
                    <span className="sr-only">
                      {item.label}
                      {seen ? " (explored)" : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          {others.length ? (
            <div className="relative z-10 flex flex-wrap items-center gap-2 border-t px-6 py-4 text-sm sm:px-8">
              <span className="text-muted-foreground">Still to explore:</span>
              {others.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border bg-background/60 px-3 py-1 text-xs transition-colors hover:border-brand/60 hover:text-brand-text"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </BentoCard>
      </Reveal>
    </section>
  );
}

export function NextUp() {
  return (
    <Suspense fallback={null}>
      <NextUpCard />
    </Suspense>
  );
}
