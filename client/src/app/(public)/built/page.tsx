import type { Metadata } from "next";
import { BuiltExplorer } from "@/components/engineering/built-explorer";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeader } from "@/components/shared/section-header";
import { getBuiltFeatures, getSettings, getSkills } from "@/lib/data/public";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    title: "What I Built",
    description: `Concrete features ${settings.name} has built across projects: RBAC, payments, order management, CI/CD and more.`,
    path: "/built",
    settings,
  });
}

export default async function BuiltPage() {
  const [features, { skills }] = await Promise.all([getBuiltFeatures(), getSkills()]);
  return (
    <div className="container-page flex flex-col gap-10 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "What I Built", path: "/built" },
        ])}
      />
      <SectionHeader
        as="h1"
        eyebrow="What I built"
        title="Features, not just projects"
        description="Search the concrete things I've designed and shipped. Each row links to the project or case study behind it."
      />
      <h2 className="sr-only">Feature list</h2>
      <BuiltExplorer features={features} skillNames={skills.map((s) => [s.slug, s.name])} />
    </div>
  );
}
