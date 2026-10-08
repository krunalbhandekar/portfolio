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
  className?: string;
};

export function CopyButton({ value, label, children, className }: CopyButtonProps) {
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
        {copied ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
}
