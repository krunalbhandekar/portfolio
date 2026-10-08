import type { SelectOption } from "../kit/fields";

/** Keep in sync with the server enums in server/src/modules/<module>/<module>.schema.ts. */
const opts = (pairs: [string, string][]): SelectOption[] =>
  pairs.map(([value, label]) => ({ value, label }));

export const PROJECT_CATEGORIES = opts([
  ["full-stack", "Full Stack"],
  ["frontend", "Frontend"],
  ["backend", "Backend"],
  ["devops", "DevOps"],
  ["api", "APIs"],
  ["saas", "SaaS"],
  ["internal-tool", "Internal Tool"],
  ["side-project", "Side Project"],
]);
export const PROJECT_TYPES = opts([
  ["professional", "Professional (company work)"],
  ["personal", "Personal"],
]);
export const PROJECT_STATUSES = opts([
  ["completed", "Completed"],
  ["in-progress", "In progress"],
  ["maintained", "Maintained"],
  ["archived", "Archived"],
]);
export const EMPLOYMENT_TYPES = opts([
  ["full-time", "Full-time"],
  ["part-time", "Part-time"],
  ["contract", "Contract"],
  ["freelance", "Freelance"],
  ["internship", "Internship"],
]);
export const LOCATION_TYPES = opts([
  ["onsite", "On-site"],
  ["remote", "Remote"],
  ["hybrid", "Hybrid"],
]);
export const SKILL_CATEGORIES = opts([
  ["frontend", "Frontend"],
  ["backend", "Backend"],
  ["database", "Database"],
  ["devops", "DevOps"],
  ["cloud", "Cloud"],
  ["tools", "Tools"],
  ["other", "Other"],
]);
export const SOCIAL_PLATFORMS = opts([
  ["github", "GitHub"],
  ["linkedin", "LinkedIn"],
  ["x", "X"],
  ["youtube", "YouTube"],
  ["website", "Website"],
  ["email", "Email"],
  ["other", "Other"],
]);
export const CTA_VARIANTS = opts([
  ["primary", "Primary"],
  ["outline", "Outline"],
  ["ghost", "Ghost"],
]);
export const BENTO_KINDS = opts([
  ["currently-building", "Currently building"],
  ["location", "Location"],
  ["stack", "Tech stack"],
  ["github", "GitHub activity"],
  ["custom", "Custom"],
]);
export const BENTO_SIZES = opts([
  ["sm", "Small (1×1)"],
  ["md", "Wide (2×1)"],
  ["lg", "Large (2×2)"],
]);
export const EXPERTISE_AREAS = opts(
  ["Frontend", "Backend", "Database", "DevOps", "Other"].map((v) => [v, v] as [string, string]),
);
export const HOMEPAGE_SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  stats: "Stats strip",
  bento: "Bento grid",
  featuredProjects: "Featured projects",
  about: "Short about",
  career: "Career preview",
  expertise: "Technical expertise",
  caseStudies: "Featured case studies (Phase 5)",
  testimonials: "Testimonials (Phase 5)",
  blog: "Latest posts (Phase 6)",
};

export const labelFor = (options: SelectOption[], value: unknown) =>
  options.find((o) => o.value === value)?.label ?? String(value ?? "—");
