"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { pageConfigs } from "./modules/pages";
import { SingletonEditor } from "./resources/singleton-editor";

const TABS = [
  { key: "now", label: "Now" },
  { key: "uses", label: "Uses" },
  { key: "faq", label: "FAQ" },
] as const;

/** Now / Uses / FAQ editors on one admin page. */
export function PagesEditor() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("now");
  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Page"
        className="mx-auto flex w-full max-w-4xl gap-1 rounded-lg border bg-surface p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm",
              tab === t.key
                ? "bg-background font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <SingletonEditor key={tab} config={pageConfigs[tab]} />
    </div>
  );
}
