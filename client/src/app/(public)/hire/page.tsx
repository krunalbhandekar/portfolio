import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Contact, FileText, Mail, MapPin } from "lucide-react";
import { ResumeDownloads } from "@/components/hire/resume-downloads";
import { ProjectCard } from "@/components/projects/project-card";
import { CopyButton } from "@/components/shared/copy-button";
import { JsonLd } from "@/components/shared/json-ld";
import { SocialIcon, isSocialIcon } from "@/components/shared/social-icon";
import { StatusBadge } from "@/components/shared/status-badge";
import { TechChip } from "@/components/shared/tech-chip";
import { buttonVariants } from "@/components/ui/button";
import { getHome, getResumes, getSettings, skillNames } from "@/lib/data/public";
import type { RecruiterFaq } from "@/lib/data/types";
import { initials } from "@/lib/initials";
import { breadcrumbJsonLd, pageMetadata, personJsonLd } from "@/lib/seo";

const FAQ: { key: keyof RecruiterFaq; label: string }[] = [
  { key: "experience", label: "Experience" },
  { key: "targetRoles", label: "Looking for" },
  { key: "noticePeriod", label: "Notice period" },
  { key: "workPreference", label: "Work mode" },
  { key: "preferredLocations", label: "Preferred locations" },
  { key: "relocation", label: "Relocation" },
  { key: "workAuthorization", label: "Work authorization" },
];

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    title: "Hire me — recruiter quick view",
    description: `${settings.name}, ${settings.role}: availability, notice period, stack, top projects and resume on one page.`,
    path: "/hire",
    settings,
  });
}

/** Recruiter Quick View (portfolio.md §4 #2): everything needed to decide, on one screen. */
export default async function HirePage() {
  const [settings, home, resumes] = await Promise.all([getSettings(), getHome(), getResumes()]);
  const names = skillNames(home.skills);
  const facts = FAQ.filter(({ key }) => settings.recruiter[key]);
  const stack = home.homepage.hero?.stack?.length
    ? home.homepage.hero.stack
    : home.skills.slice(0, 10).map((s) => s.slug);
  const projects = home.featuredProjects.slice(0, 3);
  const linkedin = settings.socials.find((s) => s.platform === "linkedin");

  return (
    <div className="container-page flex flex-col gap-10 py-12">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Hire me", path: "/hire" },
          ]),
          personJsonLd(
            settings,
            home.skills.map((s) => s.name),
          ),
        ]}
      />

      <header className="flex flex-col gap-6 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center sm:p-8">
        {settings.avatar ? (
          <Image
            src={settings.avatar.url}
            alt={settings.avatar.alt || settings.name}
            width={96}
            height={96}
            preload
            className="size-20 shrink-0 rounded-2xl border object-cover sm:size-24"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-20 shrink-0 items-center justify-center rounded-2xl border bg-surface font-mono text-xl sm:size-24"
          >
            {initials(settings.name)}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="font-mono text-xs tracking-widest text-brand-text uppercase">
            Recruiter quick view
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{settings.name}</h1>
          <p className="text-lg text-muted-foreground">{settings.role}</p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <StatusBadge text={settings.availabilityText} />
            {settings.location ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5" aria-hidden="true" /> {settings.location}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-5 rounded-2xl border bg-card p-6">
          <h2 className="font-mono text-xs tracking-widest text-brand-text uppercase">
            At a glance
          </h2>
          {facts.length ? (
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {facts.map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{settings.recruiter[key]}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ask me about notice period, work mode and location — happy to share.
            </p>
          )}
          {settings.recruiter.note ? (
            <p className="border-t pt-4 text-sm text-muted-foreground">{settings.recruiter.note}</p>
          ) : null}
          {stack.length ? (
            <div className="flex flex-col gap-2 border-t pt-4">
              <h3 className="text-xs text-muted-foreground">Primary stack</h3>
              <ul className="flex flex-wrap gap-1.5">
                {stack.map((slug) => (
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
        </section>

        <section className="flex flex-col gap-5 rounded-2xl border bg-card p-6">
          <h2 className="font-mono text-xs tracking-widest text-brand-text uppercase">
            Resume & contact
          </h2>
          <ResumeDownloads resumes={resumes} />
          <Link
            href="/resume"
            className="inline-flex w-fit items-center gap-1.5 text-sm hover:underline"
          >
            <FileText className="size-4 text-muted-foreground" aria-hidden="true" /> Read the web
            resume
          </Link>
          <ul className="flex flex-col gap-3 border-t pt-4 text-sm">
            {settings.email ? (
              <li className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
                <a href={`mailto:${settings.email}`} className="truncate hover:underline">
                  {settings.email}
                </a>
                <CopyButton
                  value={settings.email}
                  label="Copy email address"
                  toast="Email copied"
                />
              </li>
            ) : null}
            {linkedin ? (
              <li className="flex items-center gap-3">
                {isSocialIcon(linkedin.platform) ? (
                  <SocialIcon name={linkedin.platform} className="size-4 text-muted-foreground" />
                ) : null}
                <a
                  href={linkedin.url}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="hover:underline"
                >
                  {linkedin.label || "LinkedIn"}
                </a>
              </li>
            ) : null}
            {settings.calendarUrl ? (
              <li className="flex items-center gap-3">
                <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
                <a
                  href={settings.calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Book a call
                </a>
              </li>
            ) : null}
            <li className="flex items-center gap-3">
              <Contact className="size-4 text-muted-foreground" aria-hidden="true" />
              <a href="/vcard.vcf" download className="hover:underline">
                Save contact (vCard)
              </a>
            </li>
          </ul>
          <Link href="/contact" className={buttonVariants({ className: "mt-auto w-fit" })}>
            Send a message <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      </div>

      {projects.length ? (
        <section className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Top projects</h2>
            <Link href="/projects" className="text-sm text-brand-text hover:underline">
              All projects →
            </Link>
          </div>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <li key={project._id}>
                <ProjectCard project={project} skillNames={names} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
