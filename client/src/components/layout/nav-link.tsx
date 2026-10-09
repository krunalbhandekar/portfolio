"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function useIsActive(href: string) {
  const pathname = usePathname();
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

const linkClass = (active: boolean, className?: string) =>
  cn(
    "rounded-md text-sm transition-colors",
    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
    className,
  );

function ActiveNavLink({ href, children, className, onClick }: NavLinkProps) {
  const active = useIsActive(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={linkClass(active, className)}
    >
      {children}
    </Link>
  );
}

/**
 * Nav link with an active state. The current path is request data, so it's read inside
 * `<Suspense>`: pages rendered on demand (e.g. a new project slug) can still prerender their
 * shell, with the plain link as the fallback.
 */
export function NavLink(props: NavLinkProps) {
  return (
    <Suspense
      fallback={
        <Link
          href={props.href}
          onClick={props.onClick}
          className={linkClass(false, props.className)}
        >
          {props.children}
        </Link>
      }
    >
      <ActiveNavLink {...props} />
    </Suspense>
  );
}
