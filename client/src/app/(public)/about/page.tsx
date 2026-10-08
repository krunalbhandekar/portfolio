import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/shared/json-ld";
import { RichText } from "@/components/shared/rich-text";
import { SectionHeader } from "@/components/shared/section-header";
import { Timeline, TimelineItem } from "@/components/shared/timeline";
import { buttonVariants } from "@/components/ui/button";
import { getAbout, getSettings } from "@/lib/data/public";
import { excerpt } from "@/lib/format";
import { breadcrumbJsonLd, pageMetadata, personJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, about] = await Promise.all([getSettings(), getAbout()]);
  return pageMetadata({
    title: "About",
    description: about?.story
      ? excerpt(about.story, 160)
      : `About ${settings.name}, ${settings.role}.`,
    path: "/about",
    settings,
  });
}

export default async function AboutPage() {
  const [settings, about] = await Promise.all([getSettings(), getAbout()]);
  const education = about?.education ?? [];
  const portrait = about?.portrait ?? settings.avatar;

  return (
    <div className="container-page flex flex-col gap-16 py-16">
      <JsonLd
        data={[
          {
            ...personJsonLd(settings),
            ...(education.length
              ? {
                  alumniOf: education.map((e) => ({
                    "@type": "EducationalOrganization",
                    name: e.institution,
                  })),
                }
              : {}),
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />
      <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-start">
        <div className="flex flex-col gap-6">
          <SectionHeader
            as="h1"
            eyebrow="About"
            title={about?.headline || `Hi, I'm ${settings.name.split(" ")[0]}`}
          />
          {about?.story ? (
            <RichText html={about.story} className="max-w-2xl" />
          ) : (
            <p className="max-w-2xl text-muted-foreground">{settings.tagline}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <Link href="/projects" className={buttonVariants()}>
              See my work <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/contact" className={buttonVariants({ variant: "outline" })}>
              Get in touch
            </Link>
          </div>
        </div>
        {portrait ? (
          <Image
            src={portrait.url}
            alt={portrait.alt}
            width={320}
            height={320}
            preload
            fetchPriority="high"
            className="size-56 rounded-3xl border object-cover md:size-72"
          />
        ) : null}
      </div>

      {about?.journey.length ? (
        <section className="flex flex-col gap-8">
          <SectionHeader index="01" eyebrow="Journey" title="How I got here" />
          <Timeline>
            {about.journey.map((step, i) => (
              <TimelineItem
                key={i}
                period={step.period}
                title={step.title}
                current={i === about.journey.length - 1}
              >
                {step.description}
              </TimelineItem>
            ))}
          </Timeline>
        </section>
      ) : null}

      {about?.values.length ? (
        <section className="flex flex-col gap-8">
          <SectionHeader index="02" eyebrow="How I work" title="Values & principles" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {about.values.map((value) => (
              <li key={value.title} className="rounded-2xl border bg-card p-5">
                <h3 className="font-semibold">{value.title}</h3>
                {value.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {education.length ? (
        <section className="flex flex-col gap-8">
          <SectionHeader index="03" eyebrow="Education" title="Education" />
          <ul className="grid gap-4 sm:grid-cols-2">
            {education.map((e) => (
              <li key={e.institution + e.degree} className="rounded-2xl border bg-card p-5">
                <p className="font-mono text-xs text-muted-foreground">
                  {[e.startYear, e.endYear].filter(Boolean).join(" — ")}
                </p>
                <h3 className="mt-1 font-semibold">{e.institution}</h3>
                <p className="text-sm text-muted-foreground">
                  {[e.degree, e.field].filter(Boolean).join(", ")}
                </p>
                {e.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{e.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {about?.domains.length ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Domains I&apos;ve worked in
          </h2>
          <ul className="flex flex-wrap gap-2">
            {about.domains.map((domain) => (
              <li key={domain} className="rounded-full border bg-surface px-3 py-1 text-sm">
                {domain}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
