"use client";

import { useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Lock } from "lucide-react";
import { Callout } from "@/components/shared/callout";
import { useCurrentAdmin, useGoogleLogin } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { GoogleSignInButton } from "./google-sign-in-button";

function errorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return "Something went wrong. Please try again.";
  switch (error.code) {
    case "NOT_ADMIN":
      return "That Google account isn't authorized. Only the site owner can sign in.";
    case "INVALID_GOOGLE_TOKEN":
      return "Google sign-in couldn't be verified. Please try again.";
    default:
      return error.message;
  }
}

export function LoginCard() {
  const router = useRouter();
  // Also wakes the API (Render free tier) while the page loads.
  const session = useCurrentAdmin();
  const login = useGoogleLogin();
  const { reset } = login;

  // Already signed in (fresh /auth/me) → go to the dashboard. Deliberately not keyed on the
  // sign-in mutation's state: Next.js keeps this page mounted in the background (<Activity>),
  // so a stale "succeeded" flag would bounce a signed-out user back to /admin in a loop.
  useEffect(() => {
    if (session.isSuccess) router.replace("/admin");
  }, [session.isSuccess, router]);

  // Clear the sign-in attempt (pending/error state) whenever this page is hidden.
  useLayoutEffect(() => () => reset(), [reset]);

  const signIn = (credential: string) =>
    login.mutate(credential, { onSuccess: () => router.replace("/admin") });

  const busy = login.isPending || login.isSuccess;

  return (
    <main
      id="main"
      className="flex min-h-svh flex-1 flex-col items-center justify-center gap-6 px-4 py-16"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border bg-card p-8 text-center shadow-sm">
        <span className="flex size-11 items-center justify-center rounded-xl border bg-surface">
          <Lock className="size-5 text-muted-foreground" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Admin sign in</h1>
          <p className="text-sm text-muted-foreground">
            This area is restricted to the site owner.
          </p>
        </div>

        {busy ? (
          <p className="flex h-11 items-center gap-2 text-sm text-muted-foreground" role="status">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Signing you in…
          </p>
        ) : (
          <GoogleSignInButton onCredential={signIn} />
        )}

        {login.isError ? (
          <Callout variant="warning" className="w-full text-left">
            {errorMessage(login.error)}
          </Callout>
        ) : null}
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to site
      </Link>
    </main>
  );
}
