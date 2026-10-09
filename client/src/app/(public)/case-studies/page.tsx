import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { CaseStudyCard } from "@/components/case-studies/case-study-card";
import { EmptyState } from "@/components/shared/empty-state";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeader } from "@/components/shared/section-header";
import { getCaseStudies, getSettings } from "@/lib/data/public";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    title: "Case Studies",
    description: `In-depth case studies by ${settings.name}: business problem, constraints, architecture, decisions, results and learnings.`,
    path: "/case-studies",
    settings,
  });
}

export default async function CaseStudiesPage() {
  const studies = await getCaseStudies();
  return (
    <div className="container-page flex flex-col gap-10 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Case Studies", path: "/case-studies" },
        ])}
      />
      <SectionHeader
        as="h1"
        eyebrow="Case studies"
        title="Deep dives"
        description="Problem → constraints → architecture → decisions → result → learnings, for the projects that mattered most."
      />
      {studies.length === 0 ? (
        <EmptyState icon={BookOpen} title="Case studies coming soon" />
      ) : (
        <>
          <h2 className="sr-only">All case studies</h2>
          <ul className="grid gap-6 md:grid-cols-2">
            {studies.map((study) => (
              <li key={study._id}>
                <CaseStudyCard study={study} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
