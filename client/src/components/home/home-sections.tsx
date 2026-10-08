import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ProjectCard } from "@/components/projects/project-card";
import { BentoCard } from "@/components/shared/bento-card";
import { SocialIcon } from "@/components/shared/social-icon";
import { SectionHeader } from "@/components/shared/section-header";
import { Stat } from "@/components/shared/stat";
import { StatusBadge } from "@/components/shared/status-badge";
import { TechChip } from "@/components/shared/tech-chip";
import { Timeline, TimelineItem } from "@/components/shared/timeline";
import { buttonVariants } from "@/components/ui/button";
import type { HomeData, Settings } from "@/lib/data/types";
import { excerpt, formatPeriod } from "@/lib/format";
import { cn } from "@/lib/utils";

export type SectionProps = {
  home: HomeData;
  settings: Settings;
  names: Map<string, string>;
  index: string;
};

const ctaVariant = { primary: "default", outline: "outline", ghost: "ghost" } as const;

export function HeroSection({ home, settings, names }: SectionProps) {
  const hero = home.homepage.hero;
  const ctas = home.homepage.ctas?.length
    ? home.homepage.ctas
    : [
        { label: "View Projects", href: "/projects", variant: "primary" as const },
        { label: "Contact Me", href: "/contact", variant: "outline" as const },
      ];
  return (
    <section className="container-page flex flex-col gap-8 pt-16 pb-12 sm:pt-24">
      <StatusBadge text={settings.availabilityText} />
      <div className="flex max-w-3xl flex-col gap-5">
        {hero?.eyebrow ? (
          <p className="font-mono text-sm text-muted-foreground">
            {hero.eyebrow.startsWith("$") ? (
              <>
                <span className="text-brand-text">$</span>
                {hero.eyebrow.slice(1)}
              </>
            ) : (
              hero.eyebrow
            )}
          </p>
        ) : null}
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          {hero?.headline || settings.name}
          <span className="block text-muted-foreground">{hero?.subheadline || settings.role}</span>
        </h1>
        {hero?.positioning || settings.tagline ? (
          <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
            {hero?.positioning || settings.tagline}
          </p>
        ) : null}
      </div>
      {hero?.stack?.length ? (
        <ul className="flex flex-wrap gap-2" aria-label="Primary tech stack">
          {hero.stack.map((slug) => (
            <li key={slug}>
              <TechChip slug={slug} label={names.get(slug) ?? slug} />
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {ctas.map((cta, i) => (
          <Link
            key={cta.href + cta.label}
            href={cta.href}
            prefetch={cta.href.startsWith("/") ? undefined : false}
            className={cn(
              buttonVariants({ variant: ctaVariant[cta.variant] ?? "outline", size: "lg" }),
              "h-10 px-4",
            )}
          >
            {cta.label}
            {i === 0 ? <ArrowRight aria-hidden="true" /> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function StatsSection({ home }: SectionProps) {
  const stats = home.homepage.stats ?? [];
  if (!stats.length) return null;
  return (
    <section className="container-page py-8" aria-labelledby="highlights">
      <h2 id="highlights" className="sr-only">
        Highlights
      </h2>
      <Reveal>
        <ul className="grid grid-cols-2 gap-6 rounded-2xl border bg-card p-6 sm:grid-cols-4">
          {stats.map((stat) => (
            <li key={stat.label}>
              <Stat value={stat.value} label={stat.label} />
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

const sizeClass = { sm: "", md: "sm:col-span-2", lg: "sm:col-span-2 lg:row-span-2" } as const;

export function BentoSection({ home, settings, names }: SectionProps) {
  const cards = home.homepage.bento ?? [];
  if (!cards.length) return null;
  const github = settings.socials.find((s) => s.platform === "github");
  return (
    <section className="container-page py-8" aria-labelledby="at-a-glance">
      <h2 id="at-a-glance" className="sr-only">
        At a glance
      </h2>
      <Reveal>
        <div className="grid auto-rows-[minmax(140px,auto)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <BentoCard
              key={i}
              featured={card.kind === "currently-building"}
              className={sizeClass[card.size] ?? ""}
            >
              {card.kind === "location" ? (
                <>
                  <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <MapPin className="size-3.5" aria-hidden="true" /> {card.title || "Based in"}
                  </p>
                  <p className="mt-2 font-medium">{card.body || settings.location}</p>
                </>
              ) : card.kind === "stack" ? (
                <>
                  <p className="font-mono text-xs text-muted-foreground">
                    {card.title || "Daily stack"}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {(home.homepage.hero?.stack?.length
                      ? home.homepage.hero.stack
                      : home.skills.slice(0, 8).map((s) => s.slug)
                    ).map((slug) => (
                      <li key={slug}>
                        <TechChip slug={slug} label={names.get(slug) ?? slug} />
                      </li>
                    ))}
                  </ul>
                </>
              ) : card.kind === "github" ? (
                <>
                  <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <SocialIcon name="github" className="size-3.5" /> {card.title || "Open source"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
                  {github || card.href ? (
                    <a
                      href={card.href || github!.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm text-brand-text hover:underline"
                    >
                      View GitHub <ArrowRight className="size-3.5" aria-hidden="true" />
                    </a>
                  ) : null}
                </>
              ) : (
                <>
                  <p
                    className={cn(
                      "font-mono text-xs",
                      card.kind === "currently-building"
                        ? "text-brand-text"
                        : "text-muted-foreground",
                    )}
                  >
                    {card.kind === "currently-building" ? "Currently building" : card.title}
                  </p>
                  {card.kind === "currently-building" && card.title ? (
                    <h3 className="mt-2 text-xl font-semibold">{card.title}</h3>
                  ) : null}
                  {card.body ? (
                    <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
                  ) : null}
                  {card.href ? (
                    <Link
                      href={card.href}
                      className="mt-3 inline-flex items-center gap-1 text-sm text-brand-text hover:underline"
                    >
                      Learn more
                      <span className="sr-only">
                        {" "}
                        about {card.title || "what I'm building"}
                      </span>{" "}
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  ) : null}
                </>
              )}
            </BentoCard>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

export function FeaturedProjectsSection({ home, names, index }: SectionProps) {
  if (!home.featuredProjects.length) return null;
  return (
    <section className="container-page flex flex-col gap-8 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          index={index}
          eyebrow="Projects"
          title="Selected work"
          description="Systems I've designed and shipped, with the problems and decisions behind them."
        />
        <Link href="/projects" className={buttonVariants({ variant: "outline" })}>
          All projects <ArrowRight aria-hidden="true" />
        </Link>
      </div>
      <Reveal>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {home.featuredProjects.map((project) => (
            <li key={project._id}>
              <ProjectCard project={project} skillNames={names} />
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

export function AboutSection({ home, index }: SectionProps) {
  const about = home.about;
  if (!about?.story && !about?.headline) return null;
  return (
    <section className="container-page grid gap-8 py-16 md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex flex-col gap-5">
        <SectionHeader index={index} eyebrow="About" title={about.headline || "A bit about me"} />
        <Reveal>
          <p className="max-w-2xl text-pretty text-muted-foreground">{excerpt(about.story, 360)}</p>
          <Link
            href="/about"
            className="mt-4 inline-flex items-center gap-1 text-sm text-brand-text hover:underline"
          >
            Read my full story <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
      {about.portrait ? (
        <Image
          src={about.portrait.url}
          alt={about.portrait.alt}
          width={220}
          height={220}
          className="size-44 rounded-2xl border object-cover md:size-52"
        />
      ) : null}
    </section>
  );
}

export function CareerSection({ home, index }: SectionProps) {
  if (!home.experiences.length) return null;
  return (
    <section className="container-page flex flex-col gap-8 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader index={index} eyebrow="Career" title="Where I've worked" />
        <Link href="/experience" className={buttonVariants({ variant: "outline" })}>
          Full timeline <ArrowRight aria-hidden="true" />
        </Link>
      </div>
      <Reveal>
        <Timeline>
          {home.experiences.map((role) => (
            <TimelineItem
              key={role._id}
              period={formatPeriod(role.startDate, role.endDate, role.isCurrent)}
              title={role.position}
              subtitle={[role.company, role.location].filter(Boolean).join(" · ")}
              current={role.isCurrent}
            />
          ))}
        </Timeline>
      </Reveal>
    </section>
  );
}

export function ExpertiseSection({ home, names, index }: SectionProps) {
  const areas = home.homepage.expertise ?? [];
  if (!areas.length) return null;
  return (
    <section className="container-page flex flex-col gap-8 py-16">
      <SectionHeader index={index} eyebrow="Expertise" title="What I work on" />
      <Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {areas.map((area) => (
            <BentoCard key={area.area}>
              <h3 className="font-semibold">{area.area}</h3>
              {area.summary ? (
                <p className="mt-2 text-sm text-muted-foreground">{area.summary}</p>
              ) : null}
              {area.skills.length ? (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {area.skills.map((slug) => (
                    <li key={slug}>
                      <TechChip slug={slug} label={names.get(slug) ?? slug} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </BentoCard>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
