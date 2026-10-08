import { getProject, getProjects, getSettings, getSkills } from "@/lib/data/public";
import { OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Project share card";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.length ? projects.map((p) => ({ slug: p.slug })) : [{ slug: "__placeholder__" }];
}

export default async function ProjectOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [settings, project, { skills }] = await Promise.all([
    getSettings(),
    slug === "__placeholder__" ? null : getProject(slug),
    getSkills(),
  ]);
  const names = new Map(skills.map((s) => [s.slug, s.name]));
  return renderOgImage({
    eyebrow: "Project",
    title: project?.title ?? settings.name,
    subtitle:
      project?.technologies
        .slice(0, 5)
        .map((t) => names.get(t) ?? t)
        .join("  ·  ") || project?.summary,
    footer: `${settings.name} — ${settings.role}`,
    accent: settings.accentColor || "#34d399",
  });
}
