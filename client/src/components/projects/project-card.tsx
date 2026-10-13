import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Lock, Star } from "lucide-react";
import { PointerGlow } from "@/components/motion/pointer-glow";
import { TechChip } from "@/components/shared/tech-chip";
import type { ProjectCard as ProjectCardData } from "@/lib/data/types";
import { CATEGORY_LABELS } from "@/lib/format";
import { initials } from "@/lib/initials";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: ProjectCardData;
  skillNames: Map<string, string>;
  /** First cards above the fold load eagerly for LCP. */
  priority?: boolean;
  className?: string;
};

export function ProjectCard({ project, skillNames, priority, className }: ProjectCardProps) {
  const visibleTech = project.technologies.slice(0, 4);
  return (
    <article
      className={cn(
        "group/card tilt-card relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card hover:border-brand/40 hover:shadow-[0_20px_60px_-25px_color-mix(in_oklch,var(--brand)_45%,transparent)]",
        className,
      )}
    >
      <div className="relative aspect-video overflow-hidden border-b bg-muted">
        {project.thumbnail ? (
          // Morphs into the detail page's hero image (React <ViewTransition>, portfolio.md §2.3).
          <ViewTransition name={`project-thumb-${project.slug}`} share="morph" default="none">
            <Image
              src={project.thumbnail.url}
              alt={project.thumbnail.alt}
              fill
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
              preload={priority}
              fetchPriority={priority ? "high" : undefined}
              className="object-cover transition-transform duration-700 group-hover/card:scale-[1.05]"
            />
          </ViewTransition>
        ) : (
          <div
            className="flex size-full items-center justify-center bg-dots font-mono text-2xl text-muted-foreground"
            aria-hidden="true"
          >
            {initials(project.title)}
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {project.featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 font-mono text-[0.7rem] backdrop-blur">
              <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden="true" /> Featured
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[0.7rem] text-muted-foreground">
          <span>{CATEGORY_LABELS[project.category] ?? project.category}</span>
          <span aria-hidden="true">·</span>
          {project.confidential ? (
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3" aria-hidden="true" /> Private · Professional work
            </span>
          ) : (
            <span>{project.type === "professional" ? "Professional" : "Personal"}</span>
          )}
        </div>
        <h3 className="text-lg font-semibold tracking-tight">
          <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">
            {project.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">{project.summary}</p>
        {visibleTech.length ? (
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-2" aria-label="Technologies">
            {visibleTech.map((slug) => (
              <li key={slug}>
                <TechChip slug={slug} label={skillNames.get(slug) ?? slug} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <span
        aria-hidden="true"
        className="absolute top-3 right-3 flex size-7 -translate-x-1 translate-y-1 items-center justify-center rounded-full bg-background/85 opacity-0 backdrop-blur transition-all duration-300 group-hover/card:translate-0 group-hover/card:opacity-100"
      >
        <ArrowUpRight className="size-4 text-brand-text" />
      </span>
      <PointerGlow />
    </article>
  );
}
