import type { ReactNode } from "react";
import { CircleCheck, Info, Lightbulb, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const variants: Record<string, { icon: LucideIcon; className: string }> = {
  info: { icon: Info, className: "border-sky-500/30 bg-sky-500/5 [&>svg]:text-sky-500" },
  tip: { icon: Lightbulb, className: "border-brand/30 bg-brand/5 [&>svg]:text-brand-text" },
  warning: {
    icon: TriangleAlert,
    className: "border-amber-500/30 bg-amber-500/5 [&>svg]:text-amber-500",
  },
  success: {
    icon: CircleCheck,
    className: "border-emerald-500/30 bg-emerald-500/5 [&>svg]:text-emerald-500",
  },
};

type CalloutProps = {
  variant?: keyof typeof variants;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Callout({ variant = "info", title, children, className }: CalloutProps) {
  const { icon: Icon, className: variantClass } = variants[variant] ?? variants.info!;
  return (
    <div
      className={cn("flex gap-3 rounded-xl border p-4 text-sm", variantClass, className)}
      role="note"
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        {title ? <p className="font-medium text-foreground">{title}</p> : null}
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
