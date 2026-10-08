import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Lock, Star } from "lucide-react";
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
        "group/card relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-foreground/20",
        className,
      )}
    >
      <div className="relative aspect-video overflow-hidden border-b bg-muted">
        {project.thumbnail ? (
          <Image
            src={project.thumbnail.url}
            alt={project.thumbnail.alt}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            preload={priority}
            fetchPriority={priority ? "high" : undefined}
            className="object-cover transition-transform duration-500 group-hover/card:scale-[1.02]"
          />
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
      <ArrowUpRight
        className="absolute top-3 right-3 size-4 text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100"
        aria-hidden="true"
      />
    </article>
  );
}
