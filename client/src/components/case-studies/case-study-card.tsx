import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import type { CaseStudyCard as CaseStudyCardData } from "@/lib/data/types";

export function CaseStudyCard({ study }: { study: CaseStudyCardData }) {
  return (
    <article className="group/cs relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-foreground/20">
      {study.coverImage ? (
        <div className="relative aspect-[2/1] overflow-hidden border-b bg-muted">
          <Image
            src={study.coverImage.url}
            alt={study.coverImage.alt}
            fill
            sizes="(min-width: 1024px) 520px, 100vw"
            className="object-cover transition-transform duration-500 group-hover/cs:scale-[1.02]"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className="flex items-center gap-2 font-mono text-[0.7rem] text-muted-foreground">
          <span className="text-brand-text">Case study</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" /> {study.readingTime} min read
          </span>
        </p>
        <h3 className="text-xl font-semibold tracking-tight">
          <Link href={`/case-studies/${study.slug}`} className="after:absolute after:inset-0">
            {study.title}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">{study.summary}</p>
        {study.project ? (
          <p className="mt-auto pt-2 font-mono text-xs text-muted-foreground">
            Project: {study.project.title}
          </p>
        ) : null}
      </div>
      <ArrowUpRight
        className="absolute top-4 right-4 size-4 text-muted-foreground opacity-0 transition-opacity group-hover/cs:opacity-100"
        aria-hidden="true"
      />
    </article>
  );
}
