/** Public API shapes (server/src/modules/public/public.service.ts). */

export type Media = {
  mediaId: string;
  publicId: string;
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  format?: string;
};

export type Social = { platform: string; label: string; url: string };

export type Settings = {
  name: string;
  role: string;
  tagline: string;
  location: string;
  email: string;
  phone: string;
  /** Badge text; empty means no availability badge. */
  availabilityText: string;
  accentColor: string;
  socials: Social[];
  announcement: { enabled: boolean; text: string; href: string };
  calendarUrl: string;
  avatar: Media | null;
  logo: Media | null;
  seo: { title: string; description: string; ogImage: Media | null };
  updatedAt?: string;
};

export type ProjectCard = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  type: "professional" | "personal";
  technologies: string[];
  featured: boolean;
  confidential: boolean;
  thumbnail: Media | null;
  projectStatus: string;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string;
};

export type ProjectDetail = ProjectCard & {
  role: string;
  duration: string;
  teamSize: number | null;
  gallery: (Media & { caption?: string })[];
  videoUrl: string;
  liveUrl: string;
  repoUrl: string;
  demoCredentials: { username: string; password: string; note: string } | null;
  problem: string;
  solution: string;
  contributions: string[];
  features: string[];
  architecture: { description: string; diagram: string; image: Media | null };
  challenges: { challenge: string; solution: string; result: string }[];
  decisions: { question: string; answer: string }[];
  metrics: { label: string; value: string }[];
  seo: { title: string; description: string; noindex: boolean };
  experience: { company: string; position: string; companyUrl?: string } | null;
  related: ProjectCard[];
  previous: { title: string; slug: string } | null;
  next: { title: string; slug: string } | null;
  createdAt: string;
};

export type Experience = {
  _id: string;
  company: string;
  companyUrl: string;
  companyLogo: Media | null;
  position: string;
  employmentType: string;
  location: string;
  locationType: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  summary: string;
  technologies: string[];
  responsibilities: string[];
  achievements: string[];
  projects: { title: string; slug: string }[];
};

export type SkillSummary = { name: string; slug: string; icon: string; category: string };

export type Skill = SkillSummary & {
  _id: string;
  levelLabel: string;
  years: number | null;
  projects: { title: string; slug: string }[];
};

export type Capability = {
  _id: string;
  name: string;
  description: string;
  relatedSkills: string[];
};

export type About = {
  headline: string;
  story: string;
  portrait: Media | null;
  education: {
    institution: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
    description: string;
  }[];
  journey: { period: string; title: string; description: string }[];
  values: { title: string; description: string }[];
  domains: string[];
};

export type HomepageSectionKey =
  | "hero"
  | "stats"
  | "bento"
  | "featuredProjects"
  | "about"
  | "career"
  | "expertise"
  | "caseStudies"
  | "testimonials"
  | "blog";

export type Homepage = {
  hero?: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    positioning: string;
    stack: string[];
  };
  ctas?: { label: string; href: string; variant: "primary" | "outline" | "ghost" }[];
  stats?: { value: string; label: string }[];
  bento?: { kind: string; title: string; body: string; href: string; size: "sm" | "md" | "lg" }[];
  expertise?: { area: string; summary: string; skills: string[] }[];
  sections: { key: HomepageSectionKey; visible: boolean }[];
  nowSnippet?: string;
};

export type HomeData = {
  homepage: Homepage;
  featuredProjects: ProjectCard[];
  experiences: Pick<
    Experience,
    | "_id"
    | "company"
    | "position"
    | "startDate"
    | "endDate"
    | "isCurrent"
    | "location"
    | "companyLogo"
  >[];
  skills: SkillSummary[];
  about: Pick<About, "headline" | "story" | "portrait"> | null;
};

export type Resume = {
  _id: string;
  label: string;
  slug: string;
  file: Media;
  downloadUrl: string;
  updatedAt: string;
};

export type SitemapData = {
  projects: { slug: string; updatedAt: string }[];
  updatedAt: Record<string, string | null>;
};
