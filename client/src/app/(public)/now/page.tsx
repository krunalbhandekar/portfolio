import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/shared/json-ld";
import { RichText } from "@/components/shared/rich-text";
import { SectionHeader } from "@/components/shared/section-header";
import { getPage, getSettings } from "@/lib/data/public";
import { formatDate } from "@/lib/format";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSettings(), getPage("now")]);
  if (!page) return { title: "Not found", robots: { index: false } };
  return pageMetadata({
    title: page.seo.title || page.title,
    description:
      page.seo.description || page.intro || `What ${settings.name} is focused on right now.`,
    path: "/now",
    settings,
  });
}

/** /now (portfolio.md §3.16): what I'm building, learning and reading. */
export default async function NowPage() {
  const page = await getPage("now");
  if (!page) notFound();
  return (
    <div className="container-page flex max-w-3xl flex-col gap-10 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: page.title, path: "/now" },
        ])}
      />
      <SectionHeader as="h1" eyebrow="Now" title={page.title} description={page.intro} />
      <RichText html={page.content} />
      <p className="font-mono text-xs text-muted-foreground">
        Last updated {formatDate(page.updatedAt)} · inspired by{" "}
        <a
          href="https://nownownow.com/about"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          nownownow.com
        </a>
      </p>
    </div>
  );
}
