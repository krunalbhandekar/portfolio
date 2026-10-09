import type { FlowData } from "@/components/diagrams/flow-layout";

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
  announcement: {
    enabled: boolean;
    text: string;
    href: string;
    dismissible: boolean;
    endsAt: string | null;
  };
  calendarUrl: string;
  avatar: Media | null;
  logo: Media | null;
  seo: { title: string; description: string; ogImage: Media | null };
  recruiter: RecruiterFaq;
  /** Per-page SEO overrides for fixed pages (Admin → SEO). */
  seoPages: SeoOverride[];
  updatedAt?: string;
};

/** Recruiter FAQ (Site Settings), shown on /hire. Empty answers are hidden. */
export type RecruiterFaq = {
  experience: string;
  targetRoles: string;
  noticePeriod: string;
  workPreference: string;
  preferredLocations: string;
  relocation: string;
  workAuthorization: string;
  note: string;
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
  architecture: { description: string; diagram: string; image: Media | null; flow: FlowData };
  challenges: { challenge: string; solution: string; result: string }[];
  decisions: { question: string; answer: string }[];
  metrics: { label: string; value: string }[];
  seo: { title: string; description: string; noindex: boolean };
  experience: { company: string; position: string; companyUrl?: string } | null;
  caseStudy: { title: string; slug: string } | null;
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
  caseStudies: CaseStudyCard[];
  testimonials: Testimonial[];
  posts: PostCard[];
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
  caseStudies: { slug: string; updatedAt: string }[];
  posts: { slug: string; updatedAt: string }[];
  skills: { slug: string; updatedAt: string }[];
  pages: { key: string; updatedAt: string }[];
  noindex: string[];
  updatedAt: Record<string, string | null>;
};

export type CaseStudyCard = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  coverImage: Media | null;
  readingTime: number;
  featured: boolean;
  project?: { title: string; slug: string } | null;
  updatedAt: string;
};

export type CaseStudySection = { type: string; heading: string; content: string };

export type CaseStudy = CaseStudyCard & {
  sections: CaseStudySection[];
  seo: { title: string; description: string; noindex: boolean };
  project: ProjectCard | null;
  more: CaseStudyCard[];
  createdAt: string;
};

export type EngineeringItem = {
  _id: string;
  type: "architecture" | "api" | "database" | "devops" | "decision";
  title: string;
  slug: string;
  summary: string;
  content: string;
  diagram: string;
  flow: FlowData;
  project: { title: string; slug: string } | null;
  api: {
    method: string;
    path: string;
    auth: string;
    params: {
      name: string;
      location: string;
      type: string;
      required: boolean;
      description: string;
    }[];
    requestExample: string;
    responseExample: string;
    statusCodes: { code: string; description: string }[];
  };
};

export type BuiltFeature = {
  _id: string;
  feature: string;
  description: string;
  area: string;
  technologies: string[];
  project: { title: string; slug: string } | null;
  caseStudySlug: string | null;
};

export type Testimonial = {
  _id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  relationship: string;
  linkedinUrl: string;
  /** Google profile picture (visitor submissions only). */
  avatarUrl: string | null;
  /** Submitted by the person themselves, signed in with Google. */
  verified: boolean;
};

export type Achievement = {
  _id: string;
  title: string;
  description: string;
  metric: string;
  date: string | null;
  project: { title: string; slug: string } | null;
};

export type Certification = {
  _id: string;
  title: string;
  institution: string;
  type: string;
  date: string | null;
  verifyUrl: string;
  description: string;
};

/* ---------------------------------------------------------------- Phase 6 */

export type PostCard = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: Media | null;
  category: string;
  tags: string[];
  readingTime: number;
  publishedAt: string | null;
  updatedAt: string;
};

export type Post = PostCard & {
  content: string;
  crossPostUrl: string;
  status: string;
  createdAt: string;
  seo: { title: string; description: string; noindex: boolean };
  related: PostCard[];
};

export type PostList = {
  items: PostCard[];
  tags: { tag: string; count: number }[];
};

export type FeedPost = Pick<
  Post,
  "title" | "slug" | "excerpt" | "content" | "category" | "tags" | "publishedAt" | "updatedAt"
>;

export type SkillDetail = {
  _id: string;
  name: string;
  slug: string;
  category: string;
  icon: string;
  levelLabel: string;
  years: number | null;
  updatedAt: string;
  projects: ProjectCard[];
  features: { _id: string; feature: string; area: string; projectSlug: string | null }[];
  experiences: {
    _id: string;
    company: string;
    position: string;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
  }[];
  posts: PostCard[];
};

export type SearchItem = {
  type: "project" | "case-study" | "skill" | "post" | "engineering" | "page";
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
};

/* ---------------------------------------------------------------- Phase 7 */

export type SeoOverride = { path: string; title: string; description: string; noindex: boolean };

type PageBase = {
  key: "now" | "uses" | "faq";
  title: string;
  intro: string;
  seo: { title: string; description: string };
  updatedAt: string;
};
export type NowPage = PageBase & { content: string };
export type UsesPage = PageBase & {
  sections: { title: string; items: { name: string; description: string; url: string }[] }[];
};
export type FaqPage = PageBase & { items: { question: string; answer: string }[] };

export type RedirectRule = { from: string; to: string; statusCode: number };
