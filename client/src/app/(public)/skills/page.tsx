import type { Metadata } from "next";
import Link from "next/link";
import { Cpu } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeader } from "@/components/shared/section-header";
import { BrandIcon } from "@/components/shared/brand-icon";
import { getSettings, getSkills } from "@/lib/data/public";
import { SKILL_CATEGORY_LABELS } from "@/lib/format";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { techIcons } from "@/lib/tech-icons";

const CATEGORY_ORDER = ["frontend", "backend", "database", "devops", "cloud", "tools", "other"];

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    title: "Skills",
    description: `Technologies ${settings.name} uses in production, grouped by area and linked to real projects.`,
    path: "/skills",
    settings,
  });
}

export default async function SkillsPage() {
  const { skills, capabilities } = await getSkills();
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    skills: skills.filter((s) => s.category === category),
  })).filter((g) => g.skills.length);
  const names = new Map(skills.map((s) => [s.slug, s.name]));

  return (
    <div className="container-page flex flex-col gap-14 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Skills", path: "/skills" },
        ])}
      />
      <SectionHeader
        as="h1"
        eyebrow="Skills"
        title="Technologies & capabilities"
        description="What I use, how much, and where — every skill links to the projects that used it."
      />

      {groups.length === 0 ? (
        <EmptyState icon={Cpu} title="Skills coming soon" />
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          {groups.map((group) => (
            <section
              key={group.category}
              className="flex flex-col gap-4 rounded-2xl border bg-card p-6"
            >
              <h2 className="font-mono text-xs tracking-widest text-brand-text uppercase">
                {SKILL_CATEGORY_LABELS[group.category] ?? group.category}
              </h2>
              <ul className="flex flex-col divide-y">
                {group.skills.map((skill) => {
                  const icon = techIcons[skill.icon || skill.slug];
                  return (
                    <li key={skill._id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        {icon ? (
                          <BrandIcon icon={icon} className="size-4 text-muted-foreground" />
                        ) : null}
                        <Link
                          href={`/skills/${skill.slug}`}
                          className="font-medium hover:underline"
                        >
                          {skill.name}
                        </Link>
                        {skill.levelLabel || skill.years ? (
                          <span className="ml-auto font-mono text-xs text-muted-foreground">
                            {[
                              skill.levelLabel,
                              skill.years ? `${skill.years} yr${skill.years === 1 ? "" : "s"}` : "",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        ) : null}
                      </div>
                      {skill.projects.length ? (
                        <p className="text-xs text-muted-foreground">
                          Used in{" "}
                          {skill.projects.map((p, i) => (
                            <span key={p.slug}>
                              {i > 0 ? ", " : ""}
                              <Link
                                href={`/projects/${p.slug}`}
                                className="hover:text-foreground hover:underline"
                              >
                                {p.title}
                              </Link>
                            </span>
                          ))}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {capabilities.length ? (
        <section className="flex flex-col gap-8">
          <SectionHeader eyebrow="Capabilities" title="What I can build" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c) => (
              <li key={c._id} className="flex flex-col gap-2 rounded-2xl border bg-card p-5">
                <h3 className="font-semibold">{c.name}</h3>
                {c.description ? (
                  <p className="text-sm text-muted-foreground">{c.description}</p>
                ) : null}
                {c.relatedSkills.length ? (
                  <p className="mt-auto pt-2 font-mono text-xs text-muted-foreground">
                    {c.relatedSkills.map((s) => names.get(s) ?? s).join(" · ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
