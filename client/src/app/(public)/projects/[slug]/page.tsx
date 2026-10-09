import { Suspense, ViewTransition } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, KeyRound, Lock } from "lucide-react";
import { FlowDiagram } from "@/components/diagrams/flow-diagram";
import { MermaidDiagram } from "@/components/projects/mermaid-diagram";
import { ProjectCard } from "@/components/projects/project-card";
import { VideoEmbed } from "@/components/projects/video-embed";
import { Callout } from "@/components/shared/callout";
import { JsonLd } from "@/components/shared/json-ld";
import { Lightbox } from "@/components/shared/lightbox";
import { RichText } from "@/components/shared/rich-text";
import { SocialIcon } from "@/components/shared/social-icon";
import { TechChip } from "@/components/shared/tech-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { getProject, getProjects, getSettings, getSkills, skillNames } from "@/lib/data/public";
import { CATEGORY_LABELS, formatPeriod, STATUS_LABELS } from "@/lib/format";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { TrackView } from "@/components/layout/track-view";

const PLACEHOLDER = "__placeholder__";

export async function generateStaticParams() {
  const projects = await getProjects();
  // Cache Components needs at least one param; the placeholder renders a 404.
  return projects.length ? projects.map((p) => ({ slug: p.slug })) : [{ slug: PLACEHOLDER }];
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [settings, project] = await Promise.all([
    getSettings(),
    slug === PLACEHOLDER ? null : getProject(slug),
  ]);
  if (!project) return { title: "Project not found", robots: { index: false } };
  return pageMetadata({
    title: project.seo.title || project.title,
    description: project.seo.description || project.summary,
    path: `/projects/${project.slug}`,
    settings,
    noindex: project.seo.noindex,
    ownImage: true,
  });
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <h2 className="font-mono text-xs tracking-widest text-brand-text uppercase">{title}</h2>
      {children}
    </section>
  );
}

async function ProjectContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === PLACEHOLDER) notFound();
  const [project, { skills }, settings] = await Promise.all([
    getProject(slug),
    getSkills(),
    getSettings(),
  ]);
  if (!project) notFound();
  const names = skillNames(skills);
  const period = formatPeriod(project.startDate, project.endDate);
  const facts = [
    project.role && { label: "Role", value: project.role },
    project.duration && { label: "Duration", value: project.duration },
    period && { label: "Timeline", value: period },
    project.teamSize && { label: "Team size", value: String(project.teamSize) },
    project.experience && { label: "Built at", value: project.experience.company },
    { label: "Status", value: STATUS_LABELS[project.projectStatus] ?? project.projectStatus },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <article className="container-page flex flex-col gap-14 py-12">
      <TrackView type="project_view" refId={project.slug} />
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Projects", path: "/projects" },
            { name: project.title, path: `/projects/${project.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: project.title,
            description: project.summary,
            url: absoluteUrl(`/projects/${project.slug}`),
            ...(project.thumbnail ? { image: project.thumbnail.url } : {}),
            author: { "@type": "Person", name: settings.name },
            keywords: project.technologies.map((t) => names.get(t) ?? t).join(", "),
            ...(project.startDate ? { dateCreated: project.startDate } : {}),
            dateModified: project.updatedAt,
          },
        ]}
      />

      <header className="flex flex-col gap-6">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted-foreground">
          <Link href="/projects" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="size-3" aria-hidden="true" /> Projects
          </Link>
        </nav>
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="rounded-full border px-2.5 py-0.5">
            {CATEGORY_LABELS[project.category] ?? project.category}
          </span>
          <span className="rounded-full border px-2.5 py-0.5">
            {project.type === "professional" ? "Professional" : "Personal"}
          </span>
          {project.confidential ? (
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5">
              <Lock className="size-3" aria-hidden="true" /> Private project — professional work
            </span>
          ) : null}
        </div>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {project.title}
        </h1>
        <p className="max-w-3xl text-lg text-pretty text-muted-foreground">{project.summary}</p>
        <div className="flex flex-wrap gap-3">
          {project.liveUrl ? (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "lg" })}
            >
              Live demo <ExternalLink aria-hidden="true" />
            </a>
          ) : null}
          {project.caseStudy ? (
            <Link
              href={`/case-studies/${project.caseStudy.slug}`}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <BookOpen aria-hidden="true" /> Read the case study
            </Link>
          ) : null}
          {project.repoUrl && !project.confidential ? (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <SocialIcon name="github" className="size-4" /> Source
            </a>
          ) : null}
        </div>
      </header>

      {project.metrics.length ? (
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {project.metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border bg-card p-5">
              <dt className="text-sm text-muted-foreground">{metric.label}</dt>
              <dd className="mt-1 font-mono text-2xl font-semibold tracking-tight text-brand-text">
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {project.thumbnail ? (
        <ViewTransition name={`project-thumb-${project.slug}`} share="morph" default="none">
          <div className="relative aspect-video overflow-hidden rounded-2xl border bg-muted">
            <Image
              src={project.thumbnail.url}
              alt={project.thumbnail.alt}
              fill
              preload
              fetchPriority="high"
              sizes="(min-width: 1100px) 1050px, 100vw"
              className="object-cover"
            />
          </div>
        </ViewTransition>
      ) : null}

      <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
        <div className="flex min-w-0 flex-col gap-12">
          {project.problem ? (
            <Section title="Problem">
              <RichText html={project.problem} />
            </Section>
          ) : null}
          {project.solution ? (
            <Section title="Solution">
              <RichText html={project.solution} />
            </Section>
          ) : null}
          {project.contributions.length ? (
            <Section title="My contribution">
              <ul className="flex flex-col gap-2 text-muted-foreground">
                {project.contributions.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
          {project.features.length ? (
            <Section title="Features">
              <ul className="grid gap-2 sm:grid-cols-2">
                {project.features.map((feature) => (
                  <li key={feature} className="rounded-xl border bg-card px-4 py-3 text-sm">
                    {feature}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
          {project.architecture.description ||
          project.architecture.diagram ||
          project.architecture.image ||
          project.architecture.flow.nodes.length ? (
            <Section title="Architecture">
              <RichText html={project.architecture.description} />
              {project.architecture.image ? (
                <Image
                  src={project.architecture.image.url}
                  alt={project.architecture.image.alt}
                  width={project.architecture.image.width ?? 1600}
                  height={project.architecture.image.height ?? 900}
                  sizes="(min-width: 1100px) 750px, 100vw"
                  className="h-auto w-full rounded-2xl border bg-white"
                />
              ) : null}
              {project.architecture.flow.nodes.length ? (
                <FlowDiagram flow={project.architecture.flow} title={project.title} />
              ) : null}
              {project.architecture.diagram ? (
                <MermaidDiagram source={project.architecture.diagram} title={project.title} />
              ) : null}
            </Section>
          ) : null}
          {project.challenges.length ? (
            <Section title="Engineering challenges">
              <ol className="flex flex-col gap-4">
                {project.challenges.map((c, i) => (
                  <li key={i} className="grid gap-3 rounded-2xl border bg-card p-5 sm:grid-cols-3">
                    {[
                      ["Challenge", c.challenge],
                      ["Solution", c.solution],
                      ["Result", c.result],
                    ]
                      .filter(([, text]) => text)
                      .map(([label, text]) => (
                        <div key={label}>
                          <p className="font-mono text-xs text-muted-foreground">{label}</p>
                          <p className="mt-1 text-sm">{text}</p>
                        </div>
                      ))}
                  </li>
                ))}
              </ol>
            </Section>
          ) : null}
          {project.decisions.length ? (
            <Section title="Key technical decisions">
              <div className="flex flex-col divide-y rounded-2xl border bg-card">
                {project.decisions.map((d) => (
                  <details key={d.question} className="group px-5 py-4">
                    <summary className="cursor-pointer list-none font-medium marker:hidden">
                      <span className="mr-2 inline-block font-mono text-brand-text transition-transform group-open:rotate-90">
                        ›
                      </span>
                      {d.question}
                    </summary>
                    <p className="mt-3 pl-5 text-sm text-muted-foreground">{d.answer}</p>
                  </details>
                ))}
              </div>
            </Section>
          ) : null}
          {project.gallery.length ? (
            <Section title="Screenshots">
              {project.confidential ? (
                <Callout variant="info">
                  Screenshots are redacted: this is confidential professional work.
                </Callout>
              ) : null}
              <Lightbox
                title={`${project.title} screenshots`}
                images={project.gallery.map((g) => ({
                  src: g.url,
                  alt: g.caption || g.alt,
                  width: g.width ?? 1600,
                  height: g.height ?? 900,
                }))}
              />
            </Section>
          ) : null}
          {project.videoUrl ? (
            <Section title="Demo video">
              <VideoEmbed url={project.videoUrl} title={project.title} />
            </Section>
          ) : null}
          {project.demoCredentials &&
          (project.demoCredentials.username || project.demoCredentials.note) ? (
            <Section title="Try the demo">
              <Callout variant="tip" title="Demo credentials">
                <span className="flex flex-col gap-1 font-mono text-xs">
                  {project.demoCredentials.username ? (
                    <span className="inline-flex items-center gap-1.5">
                      <KeyRound className="size-3" aria-hidden="true" />{" "}
                      {project.demoCredentials.username} / {project.demoCredentials.password}
                    </span>
                  ) : null}
                  {project.demoCredentials.note ? (
                    <span>{project.demoCredentials.note}</span>
                  ) : null}
                </span>
              </Callout>
            </Section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-8 lg:sticky lg:top-20 lg:self-start">
          <dl className="flex flex-col gap-4 rounded-2xl border bg-card p-5 text-sm">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="font-mono text-xs text-muted-foreground">{fact.label}</dt>
                <dd className="mt-0.5">{fact.value}</dd>
              </div>
            ))}
          </dl>
          {project.technologies.length ? (
            <div className="flex flex-col gap-3">
              <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
                Stack
              </h2>
              <ul className="flex flex-wrap gap-1.5">
                {project.technologies.map((slug) => (
                  <li key={slug}>
                    <TechChip
                      slug={slug}
                      label={names.get(slug) ?? slug}
                      href={names.has(slug) ? `/skills/${slug}` : undefined}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      {project.previous || project.next ? (
        <nav aria-label="More projects" className="grid gap-4 border-t pt-8 sm:grid-cols-2">
          {project.previous ? (
            <Link
              href={`/projects/${project.previous.slug}`}
              className="group rounded-2xl border bg-card p-5 hover:border-foreground/20"
            >
              <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <ArrowLeft className="size-3" aria-hidden="true" /> Previous
              </span>
              <span className="mt-1 block font-medium">{project.previous.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {project.next ? (
            <Link
              href={`/projects/${project.next.slug}`}
              className="group rounded-2xl border bg-card p-5 text-right hover:border-foreground/20"
            >
              <span className="flex items-center justify-end gap-1 font-mono text-xs text-muted-foreground">
                Next <ArrowRight className="size-3" aria-hidden="true" />
              </span>
              <span className="mt-1 block font-medium">{project.next.title}</span>
            </Link>
          ) : null}
        </nav>
      ) : null}

      {project.related.length ? (
        <Section title="Related projects">
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {project.related.map((related) => (
              <li key={related._id}>
                <ProjectCard project={related} skillNames={names} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </article>
  );
}

function ProjectSkeleton() {
  return (
    <div className="container-page flex flex-col gap-6 py-12">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="aspect-video w-full rounded-2xl" />
    </div>
  );
}

export default function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  return (
    <Suspense fallback={<ProjectSkeleton />}>
      <ProjectContent params={params} />
    </Suspense>
  );
}
