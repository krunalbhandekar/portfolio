import type { Metadata } from "next";
import { NotebookPen, Rss } from "lucide-react";
import { BlogExplorer } from "@/components/blog/blog-explorer";
import { PostCard } from "@/components/blog/post-card";
import { EmptyState } from "@/components/shared/empty-state";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeader } from "@/components/shared/section-header";
import { buttonVariants } from "@/components/ui/button";
import { getPosts, getSettings } from "@/lib/data/public";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    ...pageMetadata({
      title: "Blog",
      description: `Technical articles by ${settings.name}: Node.js, MongoDB, React, system design and lessons from production.`,
      path: "/blog",
      settings,
    }),
    alternates: {
      canonical: absoluteUrl("/blog"),
      types: { "application/rss+xml": [{ url: "/rss.xml", title: `${settings.name} — Blog` }] },
    },
  };
}

export default async function BlogPage() {
  const [{ items, tags }, settings] = await Promise.all([getPosts(), getSettings()]);
  return (
    <div className="container-page flex flex-col gap-10 py-16">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: `${settings.name} — Blog`,
            url: absoluteUrl("/blog"),
            author: { "@type": "Person", name: settings.name, url: absoluteUrl("/") },
          },
        ]}
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          as="h1"
          eyebrow="Blog"
          title="Notes from production"
          description="What I learned building and running real systems — databases, APIs, frontends and the pipelines in between."
        />
        <a href="/rss.xml" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Rss aria-hidden="true" /> RSS
        </a>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={NotebookPen} title="First posts coming soon" />
      ) : (
        <>
          <h2 className="sr-only">All posts</h2>
          <BlogExplorer
            posts={items}
            tags={tags.map((t) => t.tag)}
            cards={Object.fromEntries(
              items.map((p) => [p.slug, <PostCard key={p.slug} post={p} />]),
            )}
          />
        </>
      )}
    </div>
  );
}
