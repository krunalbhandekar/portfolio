import type { Metadata } from "next";
import Link from "next/link";
import { ResumeActions } from "@/components/resume/resume-actions";
import { JsonLd } from "@/components/shared/json-ld";
import {
  getAbout,
  getExperiences,
  getHome,
  getResumes,
  getSettings,
  getSkills,
} from "@/lib/data/public";
import { formatPeriod, SKILL_CATEGORY_LABELS } from "@/lib/format";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    title: "Resume",
    description: `Resume of ${settings.name}, ${settings.role}. Download the PDF or read it here.`,
    path: "/resume",
    settings,
  });
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b pb-2 font-mono text-xs tracking-widest text-brand-text uppercase print:text-black">
      {children}
    </h2>
  );
}

/** Web resume rendered from the same CMS data (portfolio.md §3.17), print-friendly. */
export default async function ResumePage() {
  const [settings, resumes, experiences, { skills }, about, home] = await Promise.all([
    getSettings(),
    getResumes(),
    getExperiences(),
    getSkills(),
    getAbout(),
    getHome(),
  ]);
  const grouped = Object.entries(
    skills.reduce<Record<string, string[]>>((acc, s) => {
      (acc[s.category] ??= []).push(s.name);
      return acc;
    }, {}),
  );
  const contact = [
    settings.email,
    settings.phone,
    settings.location,
    ...settings.socials
      .filter((s) => s.url.startsWith("http"))
      .map((s) => s.url.replace(/^https?:\/\/(www\.)?/, "")),
  ].filter(Boolean);

  return (
    <div className="container-page flex max-w-4xl flex-col gap-10 py-16 print:py-0">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Resume", path: "/resume" },
        ])}
      />
      <header className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">{settings.name}</h1>
        <p className="text-lg text-muted-foreground">{settings.role}</p>
        <p className="font-mono text-xs text-muted-foreground">{contact.join("  ·  ")}</p>
        <ResumeActions resumes={resumes} />
      </header>

      {settings.tagline ? (
        <section className="flex flex-col gap-3">
          <Heading>Summary</Heading>
          <p className="text-muted-foreground">{settings.tagline}</p>
        </section>
      ) : null}

      {experiences.length ? (
        <section className="flex flex-col gap-5">
          <Heading>Experience</Heading>
          {experiences.map((role) => (
            <div key={role._id} className="break-inside-avoid">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">
                  {role.position} · {role.company}
                </h3>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatPeriod(role.startDate, role.endDate, role.isCurrent)}
                </span>
              </div>
              {role.summary ? (
                <p className="mt-1 text-sm text-muted-foreground">{role.summary}</p>
              ) : null}
              {role.achievements.length || role.responsibilities.length ? (
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {[...role.achievements, ...role.responsibilities].slice(0, 6).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {home.featuredProjects.length ? (
        <section className="flex flex-col gap-4">
          <Heading>Selected projects</Heading>
          <ul className="flex flex-col gap-3">
            {home.featuredProjects.map((p) => (
              <li key={p._id} className="break-inside-avoid text-sm">
                <Link href={`/projects/${p.slug}`} className="font-semibold hover:underline">
                  {p.title}
                </Link>
                <span className="text-muted-foreground"> — {p.summary}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {grouped.length ? (
        <section className="flex flex-col gap-3">
          <Heading>Skills</Heading>
          <dl className="grid gap-2 text-sm sm:grid-cols-[140px_1fr]">
            {grouped.map(([category, list]) => (
              <div key={category} className="contents">
                <dt className="font-medium">{SKILL_CATEGORY_LABELS[category] ?? category}</dt>
                <dd className="text-muted-foreground">{list.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {about?.education.length ? (
        <section className="flex flex-col gap-3">
          <Heading>Education</Heading>
          {about.education.map((e) => (
            <div
              key={e.institution + e.degree}
              className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
            >
              <span>
                <span className="font-semibold">{e.institution}</span>
                <span className="text-muted-foreground">
                  {" "}
                  — {[e.degree, e.field].filter(Boolean).join(", ")}
                </span>
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {[e.startYear, e.endYear].filter(Boolean).join(" — ")}
              </span>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
