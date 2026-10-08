"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { mainNav } from "@/config/site";
import { NavLink } from "./nav-link";

type MobileNavSheetProps = { name: string; open: boolean; onOpenChange: (open: boolean) => void };

/** Loaded on demand by <MobileNav> so the dialog code isn't in the initial bundle. */
export default function MobileNavSheet({ name, open, onOpenChange }: MobileNavSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-72 p-6">
        <SheetTitle className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {name}
        </SheetTitle>
        <nav aria-label="Mobile" className="mt-4 flex flex-col">
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              onClick={() => onOpenChange(false)}
              className="border-b py-3 text-base"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
