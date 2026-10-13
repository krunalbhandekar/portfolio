"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "motion/react";
import { mainNav } from "@/config/site";
import { sectionFor, useVisited } from "@/lib/explore";
import { cn } from "@/lib/utils";

const linkClass =
  "relative z-0 rounded-full px-3 py-1.5 text-sm transition-colors duration-200 outline-offset-0";

/**
 * Main nav with a pill that slides to the hovered link (resting on the current section). Once
 * the visitor has explored at least one section, the next unexplored one (in nav order) gets
 * a soft shimmering underline: one quiet hint, never a row of badges on a first visit.
 */
function DesktopNavLinks() {
  const pathname = usePathname();
  const visited = useVisited();
  const [hovered, setHovered] = useState<string | null>(null);
  const active = sectionFor(pathname)?.href;
  const pill = hovered ?? active;
  const suggested =
    visited?.length && visited.length < mainNav.length
      ? mainNav.find((item) => !visited.includes(item.href) && item.href !== active)?.href
      : undefined;

  return (
    <ul className="flex items-center" onPointerLeave={() => setHovered(null)}>
      {mainNav.map((item) => {
        const isActive = item.href === active;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onPointerEnter={() => setHovered(item.href)}
              onFocus={() => setHovered(item.href)}
              onBlur={() => setHovered(null)}
              className={cn(
                linkClass,
                isActive || hovered === item.href
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {pill === item.href ? (
                <m.span
                  layoutId="nav-pill"
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 -z-10 rounded-full",
                    isActive ? "bg-muted ring-1 ring-border" : "bg-muted/70",
                  )}
                />
              ) : null}
              {item.label}
              {item.href === suggested ? (
                <span aria-hidden="true" className="nav-hint" title="Explore next" />
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Plain links while the current path (request data) streams in. */
function DesktopNavFallback() {
  return (
    <ul className="flex items-center">
      {mainNav.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className={cn(linkClass, "text-muted-foreground")}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function DesktopNav() {
  return (
    <nav aria-label="Main" className="ml-auto hidden lg:block">
      <Suspense fallback={<DesktopNavFallback />}>
        <DesktopNavLinks />
      </Suspense>
    </nav>
  );
}
