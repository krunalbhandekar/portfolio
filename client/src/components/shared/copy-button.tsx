"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type CopyButtonProps = {
  value: string;
  /** Accessible label, e.g. "Copy email address". */
  label: string;
  /** Visible text; icon-only when omitted. */
  children?: React.ReactNode;
  /** Short confirmation shown as a toast, e.g. "Email copied". */
  toast?: string;
  className?: string;
};

export function CopyButton({ value, label, children, toast, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard blocked (insecure context / permissions); nothing useful to show.
    }
  }

  const Icon = copied ? Check : Copy;
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={children ? undefined : label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <Icon className={cn("size-3.5", copied && "text-brand-text")} aria-hidden="true" />
      {children}
      <span className="sr-only" aria-live="polite">
        {copied ? (toast ?? "Copied to clipboard") : ""}
      </span>
      {copied && toast ? (
        <span
          aria-hidden="true"
          className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in rounded-full bg-foreground px-4 py-2 font-sans text-sm text-background shadow-lg fade-in slide-in-from-bottom-2"
        >
          {toast}
        </span>
      ) : null}
    </button>
  );
}
