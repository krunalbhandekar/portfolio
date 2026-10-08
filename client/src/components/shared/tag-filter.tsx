"use client";

import { cn } from "@/lib/utils";

type TagFilterProps = {
  label: string;
  tags: readonly string[];
  /** Selected tag, or `null` for "All". */
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
};

export function TagFilter({ label, tags, value, onChange, className }: TagFilterProps) {
  const options: (string | null)[] = [null, ...tags];
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((tag) => {
        const active = tag === value;
        return (
          <button
            key={tag ?? "__all"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tag)}
            className={cn(
              "h-8 rounded-full border px-3 font-mono text-xs transition-colors",
              active
                ? "border-foreground bg-foreground text-background"
                : "bg-surface text-muted-foreground hover:border-foreground/25 hover:text-foreground",
            )}
          >
            {tag ?? "All"}
          </button>
        );
      })}
    </div>
  );
}
