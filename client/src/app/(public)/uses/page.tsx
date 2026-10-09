import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeader } from "@/components/shared/section-header";
import { getPage, getSettings } from "@/lib/data/public";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSettings(), getPage("uses")]);
  if (!page) return { title: "Not found", robots: { index: false } };
  return pageMetadata({
    title: page.seo.title || page.title,
    description:
      page.seo.description || page.intro || `The hardware, editor and tools ${settings.name} uses.`,
    path: "/uses",
    settings,
  });
}

/** /uses (portfolio.md §4 #16): hardware, editor, extensions and tools. */
export default async function UsesPage() {
  const page = await getPage("uses");
  if (!page) notFound();
  return (
    <div className="container-page flex flex-col gap-12 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: page.title, path: "/uses" },
        ])}
      />
      <SectionHeader as="h1" eyebrow="Uses" title={page.title} description={page.intro} />
      <div className="grid gap-8 md:grid-cols-2">
        {page.sections.map((section) => (
          <section
            key={section.title}
            className="flex flex-col gap-4 rounded-2xl border bg-card p-6"
          >
            <h2 className="font-mono text-xs tracking-widest text-brand-text uppercase">
              {section.title}
            </h2>
            <ul className="flex flex-col divide-y">
              {section.items.map((item) => (
                <li key={item.name} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit items-center gap-1.5 font-medium hover:underline"
                    >
                      {item.name}
                      <ExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="font-medium">{item.name}</span>
                  )}
                  {item.description ? (
                    <span className="text-sm text-muted-foreground">{item.description}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
