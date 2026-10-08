"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type GoogleSignInButtonProps = {
  onCredential: (credential: string) => void;
};

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/** Renders the official "Sign in with Google" button (Google Identity Services). */
export function GoogleSignInButton({ onCredential }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [scriptReady, setScriptReady] = useState(
    () => typeof window !== "undefined" && !!window.google?.accounts,
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const google = window.google;
    const container = containerRef.current;
    if (!scriptReady || !google || !container || !CLIENT_ID) return;

    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (response) => callbackRef.current(response.credential),
      auto_select: false,
      itp_support: true,
      use_fedcm_for_button: true,
    });
    const dark = document.documentElement.classList.contains("dark");
    container.replaceChildren();
    google.accounts.id.renderButton(container, {
      type: "standard",
      theme: dark ? "filled_black" : "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      logo_alignment: "left",
      width: 280,
    });
  }, [scriptReady]);

  if (!CLIENT_ID) {
    return (
      <p className="text-sm text-destructive">
        NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set, so Google sign-in is unavailable.
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setFailed(true)}
      />
      {failed ? (
        <p className="text-sm text-destructive">
          Couldn&apos;t load Google sign-in. Disable content blockers for this page and reload.
        </p>
      ) : (
        <div ref={containerRef} className="flex h-11 min-w-[280px] items-center justify-center" />
      )}
    </>
  );
}
