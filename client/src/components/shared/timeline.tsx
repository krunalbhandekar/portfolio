import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Timeline({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ol className={cn("relative flex flex-col gap-10 border-l pl-6", className)}>{children}</ol>
  );
}

type TimelineItemProps = {
  /** e.g. "Jan 2022 — Present" */
  period: string;
  title: string;
  subtitle?: string;
  current?: boolean;
  children?: ReactNode;
};

export function TimelineItem({ period, title, subtitle, current, children }: TimelineItemProps) {
  return (
    <li className="relative">
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1.5 -left-[calc(1.5rem+5px)] size-2.5 rounded-full border-2 border-background",
          current ? "bg-brand" : "bg-muted-foreground/50",
        )}
      />
      <p className="font-mono text-xs text-muted-foreground">{period}</p>
      <h3 className="mt-1 font-medium">{title}</h3>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      {children ? <div className="mt-3 text-sm text-muted-foreground">{children}</div> : null}
    </li>
  );
}
