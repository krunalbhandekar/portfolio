import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";
import { ApiCard } from "@/components/engineering/api-card";
import { FlowDiagram } from "@/components/diagrams/flow-diagram";
import { MermaidDiagram } from "@/components/projects/mermaid-diagram";
import { EmptyState } from "@/components/shared/empty-state";
import { JsonLd } from "@/components/shared/json-ld";
import { RichText } from "@/components/shared/rich-text";
import { SectionHeader } from "@/components/shared/section-header";
import { buttonVariants } from "@/components/ui/button";
import { getEngineering, getSettings } from "@/lib/data/public";
import type { EngineeringItem } from "@/lib/data/types";
import { excerpt } from "@/lib/format";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

const GROUPS: { type: EngineeringItem["type"]; id: string; eyebrow: string; title: string }[] = [
  {
    type: "architecture",
    id: "architecture",
    eyebrow: "Architecture",
    title: "System architecture",
  },
  { type: "api", id: "api", eyebrow: "APIs", title: "API showcase" },
  { type: "database", id: "database", eyebrow: "Data", title: "Database design" },
  { type: "devops", id: "devops", eyebrow: "DevOps", title: "Infrastructure & delivery" },
  { type: "decision", id: "decisions", eyebrow: "Decisions", title: "Engineering decisions" },
];

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    title: "Engineering",
    description: `How ${settings.name} designs systems: architecture, APIs, database design, DevOps and the decisions behind them.`,
    path: "/engineering",
    settings,
  });
}

function TopicEntry({ item }: { item: EngineeringItem }) {
  return (
    <article
      id={item.slug}
      className="flex scroll-mt-24 flex-col gap-4 rounded-2xl border bg-card p-6"
    >
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">{item.title}</h3>
        {item.summary ? <p className="text-sm text-muted-foreground">{item.summary}</p> : null}
      </header>
      <RichText html={item.content} className="text-sm" />
      {item.flow.nodes.length ? <FlowDiagram flow={item.flow} title={item.title} /> : null}
      {item.diagram ? <MermaidDiagram source={item.diagram} title={item.title} /> : null}
      {item.project ? (
        <Link
          href={`/projects/${item.project.slug}`}
          className="inline-flex w-fit items-center gap-1 text-sm text-brand-text hover:underline"
        >
          See it in {item.project.title} <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      ) : null}
    </article>
  );
}

export default async function EngineeringPage() {
  const items = await getEngineering();
  const groups = GROUPS.map((g) => ({
    ...g,
    items: items.filter((i) => i.type === g.type),
  })).filter((g) => g.items.length);
  const decisions = items.filter((i) => i.type === "decision");

  return (
    <div className="container-page flex flex-col gap-16 py-16">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Engineering", path: "/engineering" },
          ]),
          ...(decisions.length
            ? [
                {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: decisions.map((d) => ({
                    "@type": "Question",
                    name: d.title,
                    acceptedAnswer: { "@type": "Answer", text: excerpt(d.content, 1000) },
                  })),
                },
              ]
            : []),
        ]}
      />
      <div className="flex flex-col gap-6">
        <SectionHeader
          as="h1"
          eyebrow="Engineering"
          title="How I build systems"
          description="Architecture, API design, data modelling, delivery pipelines and the decisions behind them."
        />
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              className="rounded-full border bg-surface px-3 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              {g.eyebrow}
            </a>
          ))}
          <Link href="/built" className={buttonVariants({ variant: "outline", size: "sm" })}>
            What I built <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={Wrench} title="Engineering notes coming soon" />
      ) : null}

      {groups.map((group, index) => (
        <section
          key={group.id}
          id={group.id}
          aria-labelledby={`${group.id}-title`}
          className="flex scroll-mt-24 flex-col gap-6"
        >
          <header className="flex flex-col gap-2">
            <p className="font-mono text-xs tracking-widest text-brand-text uppercase">
              <span className="text-muted-foreground">{String(index + 1).padStart(2, "0")} / </span>
              {group.eyebrow}
            </p>
            <h2
              id={`${group.id}-title`}
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              {group.title}
            </h2>
          </header>
          {group.type === "decision" ? (
            <div className="flex flex-col divide-y rounded-2xl border bg-card">
              {group.items.map((d) => (
                <details key={d._id} id={d.slug} className="group scroll-mt-24 px-6 py-4">
                  <summary className="cursor-pointer list-none font-medium marker:hidden">
                    <span className="mr-2 inline-block font-mono text-brand-text transition-transform group-open:rotate-90">
                      ›
                    </span>
                    {d.title}
                  </summary>
                  <RichText html={d.content} className="mt-3 pl-5 text-sm" />
                </details>
              ))}
            </div>
          ) : group.type === "api" ? (
            <div className="flex flex-col gap-6">
              {group.items.map((item) => (
                <ApiCard key={item._id} item={item} />
              ))}
            </div>
          ) : (
            <div className="grid gap-6">
              {group.items.map((item) => (
                <TopicEntry key={item._id} item={item} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
