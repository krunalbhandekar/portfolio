import Link from "next/link";
import { techIcons } from "@/lib/tech-icons";
import { cn } from "@/lib/utils";
import { BrandIcon } from "./brand-icon";

type TechChipProps = {
  /** Skill slug, used for the logo lookup and the `/skills/[slug]` link. */
  slug: string;
  label: string;
  href?: string;
  className?: string;
};

const chipClass =
  "inline-flex h-7 items-center gap-1.5 rounded-md border bg-surface px-2.5 font-mono text-xs text-muted-foreground transition-colors";

export function TechChip({ slug, label, href, className }: TechChipProps) {
  const icon = techIcons[slug];
  const content = (
    <>
      {icon ? <BrandIcon icon={icon} className="size-3.5" /> : null}
      {label}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(chipClass, "hover:border-foreground/20 hover:text-foreground", className)}
      >
        {content}
      </Link>
    );
  }
  return <span className={cn(chipClass, className)}>{content}</span>;
}
