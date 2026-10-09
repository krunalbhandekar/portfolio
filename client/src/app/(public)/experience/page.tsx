import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeader } from "@/components/shared/section-header";
import { TechChip } from "@/components/shared/tech-chip";
import { getExperiences, getSettings, getSkills, skillNames } from "@/lib/data/public";
import { formatPeriod } from "@/lib/format";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Internship",
};
const MODE_LABELS: Record<string, string> = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    title: "Experience",
    description: `Career timeline of ${settings.name}: roles, responsibilities, achievements and the technologies used.`,
    path: "/experience",
    settings,
  });
}

export default async function ExperiencePage() {
  const [experiences, { skills }] = await Promise.all([getExperiences(), getSkills()]);
  const names = skillNames(skills);

  return (
    <div className="container-page flex flex-col gap-12 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Experience", path: "/experience" },
        ])}
      />
      <SectionHeader
        as="h1"
        eyebrow="Experience"
        title="Career timeline"
        description="Roles, what I was responsible for, and the impact I had."
      />

      {experiences.length === 0 ? (
        <EmptyState icon={BriefcaseBusiness} title="Timeline coming soon" />
      ) : (
        <ol className="relative flex flex-col gap-12 border-l pl-6 sm:pl-10">
          {experiences.map((role) => (
            <li key={role._id} className="relative">
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-2 -left-[calc(1.5rem+5px)] size-2.5 rounded-full border-2 border-background sm:-left-[calc(2.5rem+5px)]",
                  role.isCurrent ? "bg-brand" : "bg-muted-foreground/50",
                )}
              />
              <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
                <div className="flex flex-wrap items-start gap-4">
                  {role.companyLogo ? (
                    <Image
                      src={role.companyLogo.url}
                      alt={role.companyLogo.alt}
                      width={44}
                      height={44}
                      className="size-11 rounded-lg border bg-white object-contain p-1"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatPeriod(role.startDate, role.endDate, role.isCurrent)}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">{role.position}</h2>
                    <p className="text-sm text-muted-foreground">
                      {role.companyUrl ? (
                        <a
                          href={role.companyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:underline"
                        >
                          {role.company}
                        </a>
                      ) : (
                        <span className="text-foreground">{role.company}</span>
                      )}
                      {[
                        TYPE_LABELS[role.employmentType],
                        role.location,
                        MODE_LABELS[role.locationType],
                      ]
                        .filter(Boolean)
                        .map((part) => ` · ${part}`)
                        .join("")}
                    </p>
                  </div>
                </div>
                {role.summary ? (
                  <p className="text-sm text-muted-foreground">{role.summary}</p>
                ) : null}
                <div className="grid gap-6 md:grid-cols-2">
                  {role.responsibilities.length ? (
                    <div>
                      <h3 className="font-mono text-xs text-muted-foreground">Responsibilities</h3>
                      <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-sm">
                        {role.responsibilities.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {role.achievements.length ? (
                    <div>
                      <h3 className="font-mono text-xs text-muted-foreground">Achievements</h3>
                      <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-sm marker:text-brand">
                        {role.achievements.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
                {role.technologies.length ? (
                  <ul className="flex flex-wrap gap-1.5" aria-label="Technologies">
                    {role.technologies.map((slug) => (
                      <li key={slug}>
                        <TechChip
                          slug={slug}
                          label={names.get(slug) ?? slug}
                          href={names.has(slug) ? `/skills/${slug}` : undefined}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {role.projects.length ? (
                  <p className="text-sm text-muted-foreground">
                    Projects:{" "}
                    {role.projects.map((p, i) => (
                      <span key={p.slug}>
                        {i > 0 ? ", " : ""}
                        <Link
                          href={`/projects/${p.slug}`}
                          className="text-brand-text hover:underline"
                        >
                          {p.title}
                        </Link>
                      </span>
                    ))}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
