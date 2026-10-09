import { bundledLanguages, type BundledLanguage } from "shiki";
import { slugify } from "@/lib/slug";

export type PostBlock =
  { kind: "html"; html: string } | { kind: "code"; code: string; lang: BundledLanguage };
export type PostHeading = { id: string; label: string; level: 2 | 3 };

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  nbsp: " ",
};
const decode = (html: string) =>
  html
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, name: string) => ENTITIES[name] ?? "")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
const stripTags = (html: string) => decode(html.replace(/<[^>]+>/g, "")).trim();

/** Common aliases editors type → Shiki language ids. */
const ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  md: "markdown",
};

function language(raw: string | undefined): BundledLanguage {
  const lang = (ALIASES[raw ?? ""] ?? raw ?? "").toLowerCase();
  return (lang in bundledLanguages ? lang : "text") as BundledLanguage;
}

/**
 * Prepares sanitised post HTML for rendering: gives h2/h3 stable ids (for the table of
 * contents and deep links) and splits out code blocks so they're highlighted by Shiki on the
 * server (with a copy button) instead of shipping a highlighter to the browser.
 */
export function preparePostHtml(html: string): { blocks: PostBlock[]; headings: PostHeading[] } {
  const headings: PostHeading[] = [];
  const used = new Map<string, number>();
  const withIds = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level: string, inner: string) => {
    const label = stripTags(inner);
    const base = slugify(label) || "section";
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    const id = n > 1 ? `${base}-${n}` : base;
    headings.push({ id, label, level: level === "2" ? 2 : 3 });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });

  const blocks: PostBlock[] = [];
  const codeBlock =
    /<pre(?: class="[^"]*")?><code(?: class="language-([\w-]+)")?>([\s\S]*?)<\/code><\/pre>/g;
  let last = 0;
  for (const match of withIds.matchAll(codeBlock)) {
    if (match.index > last) blocks.push({ kind: "html", html: withIds.slice(last, match.index) });
    blocks.push({ kind: "code", code: decode(match[2] ?? ""), lang: language(match[1]) });
    last = match.index + match[0].length;
  }
  if (last < withIds.length) blocks.push({ kind: "html", html: withIds.slice(last) });
  return { blocks: blocks.filter((b) => b.kind === "code" || b.html.trim()), headings };
}
