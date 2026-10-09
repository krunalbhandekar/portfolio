"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import { SocialIcon } from "@/components/shared/social-icon";

const linkClass =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border bg-surface px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Share">
      <button
        type="button"
        className={linkClass}
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
      </button>
      <a
        className={linkClass}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
      >
        <SocialIcon name="linkedin" className="size-3.5" /> LinkedIn
      </a>
      <a
        className={linkClass}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://x.com/intent/post?url=${encoded}&text=${encodeURIComponent(title)}`}
      >
        <SocialIcon name="x" className="size-3.5" /> Post
      </a>
    </div>
  );
}
