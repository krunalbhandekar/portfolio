"use client";

import { Check } from "lucide-react";
import { m } from "motion/react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { mainNav } from "@/config/site";
import { useVisited } from "@/lib/explore";
import { NavLink } from "./nav-link";

type MobileNavSheetProps = { name: string; open: boolean; onOpenChange: (open: boolean) => void };

/** Loaded on demand by <MobileNav> so the dialog code isn't in the initial bundle. */
export default function MobileNavSheet({ name, open, onOpenChange }: MobileNavSheetProps) {
  const visited = useVisited();
  const done = visited ? mainNav.filter((item) => visited.includes(item.href)).length : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 overflow-y-auto p-6">
        <SheetTitle className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {name}
        </SheetTitle>
        {visited ? (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            <span className="text-brand-text">{done}</span>/{mainNav.length} explored
          </p>
        ) : null}
        <nav aria-label="Mobile" className="mt-4">
          <ul className="flex flex-col">
            {mainNav.map((item, i) => {
              const seen = visited?.includes(item.href) ?? false;
              return (
                <m.li
                  key={item.href}
                  initial={{ opacity: 0, x: 16 }}
                  animate={open ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
                  transition={{ delay: open ? 0.05 + i * 0.04 : 0 }}
                  className="border-b"
                >
                  <NavLink
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    className="flex flex-col gap-0.5 py-3"
                  >
                    <span className="flex items-center gap-2 text-base">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {item.label}
                      {seen ? (
                        <span
                          aria-hidden="true"
                          className="ml-auto flex size-4 items-center justify-center rounded-full bg-brand/15 text-brand-text"
                        >
                          <Check className="size-2.5" strokeWidth={3} />
                        </span>
                      ) : null}
                    </span>
                    <span className="line-clamp-1 pl-6 text-xs text-muted-foreground">
                      {item.teaser}
                    </span>
                  </NavLink>
                </m.li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
