import type { Metadata } from "next";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectsExplorer } from "@/components/projects/projects-explorer";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeader } from "@/components/shared/section-header";
import { getProjects, getSettings, getSkills, skillNames } from "@/lib/data/public";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    title: "Projects",
    description: `Professional and personal projects by ${settings.name}: problems, architecture, decisions and measurable impact.`,
    path: "/projects",
    settings,
  });
}

export default async function ProjectsPage() {
  const [projects, { skills }] = await Promise.all([getProjects(), getSkills()]);
  const names = skillNames(skills);
  const cards = Object.fromEntries(
    projects.map((project, i) => [
      project._id,
      <ProjectCard key={project._id} project={project} skillNames={names} priority={i < 2} />,
    ]),
  );
  return (
    <div className="container-page flex flex-col gap-10 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
        ])}
      />
      <SectionHeader
        as="h1"
        eyebrow="Projects"
        title="Systems I've designed and shipped"
        description="Production work and side projects, each with the problem, the decisions behind it and the outcome."
      />
      <h2 className="sr-only">All projects</h2>
      <ProjectsExplorer
        projects={projects}
        cards={cards}
        skillNames={skills.map((s) => [s.slug, s.name])}
      />
    </div>
  );
}
