"use client";

import Link from "next/link";
import { LayoutDashboard, Lock } from "lucide-react";
import { useSessionHint } from "@/lib/session-hint";
import { cn } from "@/lib/utils";

/**
 * Footer admin entry (portfolio.md §3.2): "Admin" → login, or "Dashboard" when a session
 * cookie hint exists. Reads a cookie only, so public pages never call the API for it.
 */
export function AdminLink({ className }: { className?: string }) {
  const signedIn = useSessionHint();
  const Icon = signedIn ? LayoutDashboard : Lock;
  return (
    <Link
      href={signedIn ? "/admin" : "/admin/login"}
      rel="nofollow"
      prefetch={false}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      <Icon className="size-3" aria-hidden="true" />
      {signedIn ? "Dashboard" : "Admin"}
    </Link>
  );
}
