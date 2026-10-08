import Link from "next/link";
import { mainNav } from "@/config/site";
import { initials } from "@/lib/initials";
import { MobileNav } from "./mobile-nav";
import { NavLink } from "./nav-link";
import { ThemeToggle } from "./theme-toggle";

export function Navbar({ name }: { name: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      <div className="container-page flex h-14 items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 rounded-md">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-md border bg-surface font-mono text-xs font-semibold"
          >
            {initials(name)}
          </span>
          {/* Visible from sm; still the link's accessible name on mobile. */}
          <span className="sr-only text-sm font-medium sm:not-sr-only">{name}</span>
        </Link>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-6 md:flex">
          {mainNav.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          {/* ⌘K command palette trigger returns in Phase 6 (components/layout/command-trigger.tsx). */}
          <ThemeToggle />
          <MobileNav name={name} />
        </div>
      </div>
    </header>
  );
}
