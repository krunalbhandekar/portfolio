const monthYear = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export const formatMonth = (value: string | null | undefined) =>
  value ? monthYear.format(new Date(value)) : "";

export function formatPeriod(
  start: string | null | undefined,
  end: string | null | undefined,
  current?: boolean,
) {
  const from = formatMonth(start);
  const to = current ? "Present" : formatMonth(end);
  return from && to ? `${from} — ${to}` : from || to;
}

/** Plain-text excerpt from sanitised rich-text HTML. */
export function excerpt(html: string, length = 280) {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length).replace(/\s+\S*$/, "")}…` : text;
}

export const CATEGORY_LABELS: Record<string, string> = {
  "full-stack": "Full Stack",
  frontend: "Frontend",
  backend: "Backend",
  devops: "DevOps",
  api: "APIs",
  saas: "SaaS",
  "internal-tool": "Internal Tool",
  "side-project": "Side Project",
};

export const SKILL_CATEGORY_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  devops: "DevOps",
  cloud: "Cloud",
  tools: "Tools",
  other: "Other",
};

export const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  "in-progress": "In progress",
  maintained: "Maintained",
  archived: "Archived",
};

export const CASE_STUDY_SECTION_LABELS: Record<string, string> = {
  problem: "Problem",
  requirements: "Business requirements",
  constraints: "Constraints",
  architecture: "Architecture",
  database: "Database design",
  api: "API design",
  implementation: "Implementation",
  challenges: "Challenges",
  solution: "Solution",
  result: "Result",
  learnings: "Learnings",
  custom: "Notes",
};

export const sectionHeading = (s: { type: string; heading: string }) =>
  s.heading || CASE_STUDY_SECTION_LABELS[s.type] || "Section";
