import { cacheLife } from "next/cache";
import { codeToHtml, type BundledLanguage } from "shiki";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

type CodeBlockProps = {
  code: string;
  lang: BundledLanguage;
  filename?: string;
  className?: string;
};

// Cached: Shiki reads the clock internally, which Cache Components rejects during prerender,
// and the output only changes when the code does.
async function highlight(code: string, lang: BundledLanguage) {
  "use cache";
  cacheLife("max");
  return codeToHtml(code, {
    lang,
    // High-contrast light theme: the regular one dips below WCAG AA on our code background.
    themes: { light: "github-light-high-contrast", dark: "github-dark-default" },
    defaultColor: false,
  });
}

/** Server-rendered Shiki highlighting with light/dark themes switched by CSS (see globals.css). */
export async function CodeBlock({ code, lang, filename, className }: CodeBlockProps) {
  const html = await highlight(code.trim(), lang);

  return (
    <figure className={cn("overflow-hidden rounded-xl border bg-surface", className)}>
      <figcaption className="flex h-10 items-center justify-between gap-3 border-b px-4">
        <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">
          {filename ?? lang}
        </span>
        <CopyButton value={code.trim()} label="Copy code" className="shrink-0" />
      </figcaption>
      <div
        className="overflow-x-auto p-4 font-mono text-[0.8125rem] leading-relaxed [&_pre]:outline-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </figure>
  );
}
