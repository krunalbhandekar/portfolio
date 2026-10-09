"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";

const buttonClass =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border bg-surface px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground";

/** "Copy link" for posts and case studies (no third-party share buttons). */
export function ShareButtons({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={buttonClass}
      onClick={() =>
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
      }
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden="true" />
      ) : (
        <Link2 className="size-3.5" aria-hidden="true" />
      )}
      {copied ? "Copied" : "Copy link"}
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </button>
  );
}
