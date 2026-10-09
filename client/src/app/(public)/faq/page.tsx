import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { JsonLd } from "@/components/shared/json-ld";
import { RichText } from "@/components/shared/rich-text";
import { SectionHeader } from "@/components/shared/section-header";
import { getPage, getSettings } from "@/lib/data/public";
import { excerpt } from "@/lib/format";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSettings(), getPage("faq")]);
  if (!page) return { title: "Not found", robots: { index: false } };
  return pageMetadata({
    title: page.seo.title || page.title,
    description:
      page.seo.description || page.intro || `Frequently asked questions for ${settings.name}.`,
    path: "/faq",
    settings,
  });
}

/** /faq (portfolio.md §4 #17) with `FAQPage` structured data. */
export default async function FaqPage() {
  const page = await getPage("faq");
  if (!page) notFound();
  return (
    <div className="container-page flex max-w-3xl flex-col gap-10 py-16">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: page.title, path: "/faq" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: page.items.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: excerpt(item.answer, 1000) },
            })),
          },
        ]}
      />
      <SectionHeader as="h1" eyebrow="FAQ" title={page.title} description={page.intro} />
      <div className="flex flex-col divide-y rounded-2xl border bg-card">
        {page.items.map((item) => (
          <details key={item.question} className="group px-6 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
              <h2 className="text-base">{item.question}</h2>
              <ChevronDown
                className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <RichText html={item.answer} className="mt-3 text-sm text-muted-foreground" />
          </details>
        ))}
      </div>
    </div>
  );
}
