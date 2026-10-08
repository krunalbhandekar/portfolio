"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentAdmin } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";

/** Renders children only for a signed-in admin; otherwise redirects to the login page. */
export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isPending, isError, error, refetch, isRefetching } = useCurrentAdmin();
  const unauthenticated = isError && error instanceof ApiError && error.status === 401;

  useEffect(() => {
    if (unauthenticated) router.replace("/admin/login");
  }, [unauthenticated, router]);

  if (isPending || unauthenticated) {
    return (
      <div className="flex min-h-svh flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          {unauthenticated ? "Redirecting to sign in…" : "Checking your session…"}
        </p>
        {!unauthenticated ? (
          <p className="max-w-xs text-xs text-muted-foreground">
            If the server was asleep, this can take up to a minute.
          </p>
        ) : null}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-svh flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Couldn't load your session."}
        </p>
        <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={isRefetching ? "animate-spin" : undefined} aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  }

  return children;
}
