import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { CaseStudyCard } from "@/components/case-studies/case-study-card";
import { ShareButtons } from "@/components/case-studies/share-buttons";
import { TableOfContents } from "@/components/case-studies/toc";
import { ProjectCard } from "@/components/projects/project-card";
import { JsonLd } from "@/components/shared/json-ld";
import { RichText } from "@/components/shared/rich-text";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCaseStudies,
  getCaseStudy,
  getSettings,
  getSkills,
  skillNames,
} from "@/lib/data/public";
import { excerpt, sectionHeading } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

const PLACEHOLDER = "__placeholder__";

export async function generateStaticParams() {
  const studies = await getCaseStudies();
  return studies.length ? studies.map((s) => ({ slug: s.slug })) : [{ slug: PLACEHOLDER }];
}

export async function generateMetadata({
  params,
}: PageProps<"/case-studies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [settings, study] = await Promise.all([
    getSettings(),
    slug === PLACEHOLDER ? null : getCaseStudy(slug),
  ]);
  if (!study) return { title: "Case study not found", robots: { index: false } };
  return pageMetadata({
    title: study.seo.title || study.title,
    description: study.seo.description || study.summary,
    path: `/case-studies/${study.slug}`,
    settings,
    noindex: study.seo.noindex,
  });
}

async function CaseStudyContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === PLACEHOLDER) notFound();
  const [study, settings, { skills }] = await Promise.all([
    getCaseStudy(slug),
    getSettings(),
    getSkills(),
  ]);
  if (!study) notFound();

  const sections = study.sections.filter((s) => s.content);
  const toc = sections.map((s, i) => ({
    id: `${slugify(sectionHeading(s)) || "section"}-${i + 1}`,
    label: sectionHeading(s),
  }));
  const url = absoluteUrl(`/case-studies/${study.slug}`);

  return (
    <article className="container-page flex flex-col gap-12 py-12">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Case Studies", path: "/case-studies" },
            { name: study.title, path: `/case-studies/${study.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: study.title,
            description: study.summary,
            url,
            ...(study.coverImage ? { image: study.coverImage.url } : {}),
            author: { "@type": "Person", name: settings.name, url: absoluteUrl("/") },
            datePublished: study.createdAt,
            dateModified: study.updatedAt,
            wordCount: excerpt(sections.map((s) => s.content).join(" "), 100_000).split(/\s+/)
              .length,
          },
        ]}
      />

      <header className="flex max-w-3xl flex-col gap-5">
        <Link
          href="/case-studies"
          className="inline-flex w-fit items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden="true" /> Case studies
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {study.title}
        </h1>
        <p className="text-lg text-pretty text-muted-foreground">{study.summary}</p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <Clock className="size-3.5" aria-hidden="true" /> {study.readingTime} min read
          </span>
          <ShareButtons url={url} title={study.title} />
        </div>
      </header>

      {study.coverImage ? (
        <div className="relative aspect-[2/1] overflow-hidden rounded-2xl border bg-muted">
          <Image
            src={study.coverImage.url}
            alt={study.coverImage.alt}
            fill
            preload
            fetchPriority="high"
            sizes="(min-width: 1100px) 1050px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
        {toc.length > 1 ? (
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <TableOfContents items={toc} />
            </div>
          </aside>
        ) : (
          <div className="hidden lg:block" />
        )}
        <div className="flex max-w-3xl min-w-0 flex-col gap-12">
          {sections.map((section, i) => (
            <section key={toc[i]!.id} aria-labelledby={toc[i]!.id} className="flex flex-col gap-4">
              <h2 id={toc[i]!.id} className="scroll-mt-24 text-2xl font-semibold tracking-tight">
                <span className="mr-3 font-mono text-sm text-brand-text">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {toc[i]!.label}
              </h2>
              <RichText html={section.content} />
            </section>
          ))}
        </div>
      </div>

      {study.project ? (
        <section className="flex flex-col gap-4 border-t pt-10">
          <h2 className="font-mono text-xs tracking-widest text-brand-text uppercase">
            The project
          </h2>
          <div className="max-w-md">
            <ProjectCard project={study.project} skillNames={skillNames(skills)} />
          </div>
        </section>
      ) : null}

      {study.more.length ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-mono text-xs tracking-widest text-brand-text uppercase">
            More case studies
          </h2>
          <ul className="grid gap-6 md:grid-cols-2">
            {study.more.map((s) => (
              <li key={s._id}>
                <CaseStudyCard study={s} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function CaseStudySkeleton() {
  return (
    <div className="container-page flex flex-col gap-6 py-12">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="aspect-[2/1] w-full rounded-2xl" />
    </div>
  );
}

export default function CaseStudyPage({ params }: PageProps<"/case-studies/[slug]">) {
  return (
    <Suspense fallback={<CaseStudySkeleton />}>
      <CaseStudyContent params={params} />
    </Suspense>
  );
}
