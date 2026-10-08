import { cn } from "@/lib/utils";
import type { Settings } from "@/lib/data/types";

const DEFAULT_LABELS: Record<Settings["availability"]["status"], string> = {
  open: "Available for opportunities",
  freelance: "Available for freelance",
  "not-looking": "Not looking right now",
};

export function StatusBadge({
  availability,
  className,
}: {
  availability: Settings["availability"];
  className?: string;
}) {
  const active = availability.status !== "not-looking";
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full border bg-surface px-3 py-1 font-mono text-xs text-muted-foreground",
        className,
      )}
    >
      <span className="relative flex size-2" aria-hidden="true">
        {active ? (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
        ) : null}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            active ? "bg-brand" : "bg-muted-foreground",
          )}
        />
      </span>
      {availability.label || DEFAULT_LABELS[availability.status]}
    </span>
  );
}
