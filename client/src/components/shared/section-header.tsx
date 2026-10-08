import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  /** Mono eyebrow, e.g. index "01" + label "Projects" → "01 / Projects". */
  index?: string;
  eyebrow: string;
  title: string;
  description?: string;
  /** Use "h1" for the page-level header; sections default to "h2". */
  as?: "h1" | "h2";
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  index,
  eyebrow,
  title,
  description,
  as: Heading = "h2",
  align = "left",
  className,
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "flex max-w-2xl flex-col gap-3",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      <p className="font-mono text-xs tracking-widest text-brand-text uppercase">
        {index ? <span className="text-muted-foreground">{index} / </span> : null}
        {eyebrow}
      </p>
      <Heading
        className={cn(
          "font-semibold tracking-tight text-balance",
          Heading === "h1" ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl",
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p className="text-base text-pretty text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
