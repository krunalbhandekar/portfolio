"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { useCurrentAdmin, useLogout } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { AdminAvatar } from "./admin-avatar";
import { availableModules } from "./admin-modules";
import { useUnreadCount } from "./messages/use-messages";
import { usePendingTestimonials } from "./modules/use-pending-testimonials";

function ModuleNav({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  const unread = useUnreadCount();
  const pending = usePendingTestimonials();
  const badges: Record<string, { count?: number; label: string }> = {
    "/admin/messages": { count: unread.data, label: "unread" },
    "/admin/testimonials": { count: pending.data, label: "to review" },
  };
  return (
    <nav
      aria-label="Admin"
      className={cn(
        orientation === "vertical"
          ? "flex flex-col gap-0.5"
          : "flex gap-1 overflow-x-auto border-b px-4 py-2 lg:hidden",
      )}
    >
      {availableModules.map(({ label, href, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
            {badges[href]?.count ? (
              <span className="ml-auto rounded-full bg-brand px-1.5 font-mono text-[0.65rem] leading-4 text-brand-foreground">
                {badges[href].count}
                <span className="sr-only"> {badges[href].label}</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { data: admin } = useCurrentAdmin();
  const logout = useLogout();

  return (
    <div className="flex min-h-svh flex-1 bg-background">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-6 border-r bg-surface p-4 lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5 px-2 pt-1">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-md border bg-background font-mono text-xs font-semibold"
          >
            {siteConfig.shortName}
          </span>
          <span className="text-sm font-medium">Admin</span>
        </Link>
        <ModuleNav orientation="vertical" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
            <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase lg:hidden">
              Admin
            </span>
            <div className="ml-auto flex items-center gap-1">
              <Link
                href="/"
                target="_blank"
                className="mr-1 hidden items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                View site <ExternalLink className="size-3.5" aria-hidden="true" />
              </Link>
              <ThemeToggle />
              {admin ? (
                <span className="ml-1 flex items-center gap-2" title={admin.email}>
                  <AdminAvatar admin={admin} />
                  <span className="hidden text-sm md:inline">{admin.name ?? admin.email}</span>
                </span>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                <LogOut aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
                <span className="sr-only sm:hidden">Sign out</span>
              </Button>
              {logout.isError ? (
                <span role="alert" className="ml-1 max-w-48 text-xs text-destructive">
                  Sign-out failed: {logout.error.message}
                </span>
              ) : null}
            </div>
          </div>
          <ModuleNav orientation="horizontal" />
        </header>
        <main id="main" className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
