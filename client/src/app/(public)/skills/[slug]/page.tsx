import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { PostCard } from "@/components/blog/post-card";
import { ProjectCard } from "@/components/projects/project-card";
import { BrandIcon } from "@/components/shared/brand-icon";
import { JsonLd } from "@/components/shared/json-ld";
import { Skeleton } from "@/components/ui/skeleton";
import { getSettings, getSkill, getSkills, skillNames } from "@/lib/data/public";
import { formatPeriod, SKILL_CATEGORY_LABELS } from "@/lib/format";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { techIcons } from "@/lib/tech-icons";

const PLACEHOLDER = "__placeholder__";

export async function generateStaticParams() {
  const { skills } = await getSkills();
  return skills.length ? skills.map((s) => ({ slug: s.slug })) : [{ slug: PLACEHOLDER }];
}

const experienceLabel = (levelLabel: string, years: number | null) =>
  [levelLabel, years ? `${years} yr${years === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · ");

export async function generateMetadata({ params }: PageProps<"/skills/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [settings, skill] = await Promise.all([
    getSettings(),
    slug === PLACEHOLDER ? null : getSkill(slug),
  ]);
  if (!skill) return { title: "Skill not found", robots: { index: false } };
  const count = skill.projects.length;
  return pageMetadata({
    title: `${skill.name} projects & experience`,
    description: `How ${settings.name} uses ${skill.name}${
      count ? ` — ${count} project${count === 1 ? "" : "s"}` : ""
    }${skill.features.length ? `, features built` : ""}${
      skill.posts.length ? " and articles" : ""
    }.`,
    path: `/skills/${skill.slug}`,
    settings,
  });
}

async function SkillContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === PLACEHOLDER) notFound();
  const [skill, { skills }] = await Promise.all([getSkill(slug), getSkills()]);
  if (!skill) notFound();
  const icon = techIcons[skill.icon || skill.slug];
  const level = experienceLabel(skill.levelLabel, skill.years);
  const names = skillNames(skills);
  const empty =
    !skill.projects.length &&
    !skill.features.length &&
    !skill.experiences.length &&
    !skill.posts.length;

  return (
    <div className="container-page flex flex-col gap-12 py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Skills", path: "/skills" },
          { name: skill.name, path: `/skills/${skill.slug}` },
        ])}
      />
      <header className="flex max-w-3xl flex-col gap-5">
        <Link
          href="/skills"
          className="inline-flex w-fit items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden="true" /> Skills
        </Link>
        <p className="font-mono text-xs tracking-widest text-brand-text uppercase">
          {SKILL_CATEGORY_LABELS[skill.category] ?? skill.category}
        </p>
        <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          {icon ? <BrandIcon icon={icon} className="size-9 shrink-0 sm:size-11" /> : null}
          {skill.name}
        </h1>
        {level ? <p className="font-mono text-sm text-muted-foreground">{level}</p> : null}
      </header>

      {empty ? (
        <p className="text-muted-foreground">
          Details about where I&apos;ve used {skill.name} are coming soon.
        </p>
      ) : null}

      {skill.projects.length ? (
        <section className="flex flex-col gap-5">
          <h2 className="text-xl font-semibold tracking-tight">Projects using {skill.name}</h2>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {skill.projects.map((project) => (
              <li key={project._id}>
                <ProjectCard project={project} skillNames={names} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        {skill.features.length ? (
          <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
            <h2 className="font-mono text-xs tracking-widest text-brand-text uppercase">
              Features built with {skill.name}
            </h2>
            <ul className="flex flex-col divide-y text-sm">
              {skill.features.map((f) => (
                <li key={f._id} className="flex items-center justify-between gap-3 py-2.5">
                  {f.projectSlug ? (
                    <Link href={`/projects/${f.projectSlug}`} className="hover:underline">
                      {f.feature}
                    </Link>
                  ) : (
                    <span>{f.feature}</span>
                  )}
                  <span className="font-mono text-xs text-muted-foreground capitalize">
                    {f.area}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/built"
              className="mt-auto inline-flex w-fit items-center gap-1 text-xs text-brand-text hover:underline"
            >
              Everything I&apos;ve built <ArrowUpRight className="size-3" aria-hidden="true" />
            </Link>
          </section>
        ) : null}

        {skill.experiences.length ? (
          <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
            <h2 className="font-mono text-xs tracking-widest text-brand-text uppercase">
              Used at work
            </h2>
            <ul className="flex flex-col divide-y text-sm">
              {skill.experiences.map((e) => (
                <li
                  key={e._id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                >
                  <span>
                    <span className="font-medium">{e.position}</span>
                    <span className="text-muted-foreground"> · {e.company}</span>
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatPeriod(e.startDate, e.endDate, e.isCurrent)}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/experience"
              className="mt-auto inline-flex w-fit items-center gap-1 text-xs text-brand-text hover:underline"
            >
              Full career timeline <ArrowUpRight className="size-3" aria-hidden="true" />
            </Link>
          </section>
        ) : null}
      </div>

      {skill.posts.length ? (
        <section className="flex flex-col gap-5">
          <h2 className="text-xl font-semibold tracking-tight">Writing about {skill.name}</h2>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {skill.posts.map((post) => (
              <li key={post._id}>
                <PostCard post={post} compact />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function SkillSkeleton() {
  return (
    <div className="container-page flex flex-col gap-6 py-12">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-12 w-1/3" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}

export default function SkillPage({ params }: PageProps<"/skills/[slug]">) {
  return (
    <Suspense fallback={<SkillSkeleton />}>
      <SkillContent params={params} />
    </Suspense>
  );
}
