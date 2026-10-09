import type { Metadata } from "next";
import {
  AboutSection,
  BentoSection,
  BlogSection,
  CareerSection,
  CaseStudiesSection,
  ExpertiseSection,
  FeaturedProjectsSection,
  HeroSection,
  StatsSection,
  TestimonialsSection,
  type SectionProps,
} from "@/components/home/home-sections";
import { JsonLd } from "@/components/shared/json-ld";
import { getHome, getSettings, skillNames } from "@/lib/data/public";
import type { HomepageSectionKey } from "@/lib/data/types";
import { pageMetadata, personJsonLd, SITE_URL } from "@/lib/seo";

const SECTIONS: Partial<Record<HomepageSectionKey, (props: SectionProps) => React.ReactNode>> = {
  hero: HeroSection,
  stats: StatsSection,
  bento: BentoSection,
  featuredProjects: FeaturedProjectsSection,
  about: AboutSection,
  career: CareerSection,
  expertise: ExpertiseSection,
  caseStudies: CaseStudiesSection,
  testimonials: TestimonialsSection,
  blog: BlogSection,
};

const DEFAULT_ORDER: HomepageSectionKey[] = [
  "hero",
  "stats",
  "bento",
  "featuredProjects",
  "about",
  "caseStudies",
  "career",
  "expertise",
  "testimonials",
  "blog",
];

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    ...pageMetadata({ path: "/", settings }),
    title: { absolute: settings.seo.title || `${settings.name} — ${settings.role}` },
  };
}

export default async function Home() {
  const [settings, home] = await Promise.all([getSettings(), getHome()]);
  const names = skillNames(home.skills);
  const order = home.homepage.sections.length
    ? home.homepage.sections.filter((s) => s.visible).map((s) => s.key)
    : DEFAULT_ORDER;
  // Hero always renders first, even if hidden/misordered, so the page keeps its h1.
  const keys = ["hero" as const, ...order.filter((key) => key !== "hero")];

  let n = 0;
  return (
    <>
      <JsonLd
        data={[
          personJsonLd(
            settings,
            home.skills.map((s) => s.name),
          ),
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: settings.name,
            url: SITE_URL,
          },
        ]}
      />
      {keys.map((key) => {
        const Section = SECTIONS[key];
        if (!Section) return null;
        const index = key === "hero" ? "" : String(++n).padStart(2, "0");
        return <Section key={key} home={home} settings={settings} names={names} index={index} />;
      })}
    </>
  );
}
