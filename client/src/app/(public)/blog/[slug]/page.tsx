import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ExternalLink } from "lucide-react";
import { PostCard } from "@/components/blog/post-card";
import { PostContent } from "@/components/blog/post-content";
import { ShareButtons } from "@/components/case-studies/share-buttons";
import { TableOfContents } from "@/components/case-studies/toc";
import { TrackView } from "@/components/layout/track-view";
import { JsonLd } from "@/components/shared/json-ld";
import { Skeleton } from "@/components/ui/skeleton";
import { getPost, getPosts, getSettings } from "@/lib/data/public";
import { formatDate } from "@/lib/format";
import { preparePostHtml } from "@/lib/post-html";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

const PLACEHOLDER = "__placeholder__";

export async function generateStaticParams() {
  const { items } = await getPosts();
  return items.length ? items.map((p) => ({ slug: p.slug })) : [{ slug: PLACEHOLDER }];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [settings, post] = await Promise.all([
    getSettings(),
    slug === PLACEHOLDER ? null : getPost(slug),
  ]);
  if (!post) return { title: "Post not found", robots: { index: false } };
  const base = pageMetadata({
    title: post.seo.title || post.title,
    description: post.seo.description || post.excerpt,
    path: `/blog/${post.slug}`,
    settings,
    noindex: post.seo.noindex,
    ownImage: true,
  });
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      tags: post.tags,
    },
  };
}

async function PostArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === PLACEHOLDER) notFound();
  const [post, settings] = await Promise.all([getPost(slug), getSettings()]);
  if (!post) notFound();

  const { blocks, headings } = preparePostHtml(post.content);
  const toc = headings.filter((h) => h.level === 2).map(({ id, label }) => ({ id, label }));
  const url = absoluteUrl(`/blog/${post.slug}`);
  const published = post.publishedAt ?? post.createdAt;

  return (
    <article className="container-page flex flex-col gap-10 py-12">
      <TrackView type="post_view" refId={post.slug} />
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            url,
            mainEntityOfPage: url,
            image: post.coverImage?.url ?? absoluteUrl(`/blog/${post.slug}/opengraph-image`),
            author: { "@type": "Person", name: settings.name, url: absoluteUrl("/") },
            datePublished: published,
            dateModified: post.updatedAt,
            ...(post.tags.length ? { keywords: post.tags.join(", ") } : {}),
            ...(post.category ? { articleSection: post.category } : {}),
          },
        ]}
      />

      <header className="flex max-w-3xl flex-col gap-5">
        <Link
          href="/blog"
          className="inline-flex w-fit items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden="true" /> Blog
        </Link>
        {post.category ? (
          <p className="font-mono text-xs tracking-widest text-brand-text uppercase">
            {post.category}
          </p>
        ) : null}
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {post.title}
        </h1>
        <p className="text-lg text-pretty text-muted-foreground">{post.excerpt}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 font-mono text-xs text-muted-foreground">
          <time dateTime={published}>{formatDate(published)}</time>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" /> {post.readingTime} min read
          </span>
          <ShareButtons url={url} />
          {post.crossPostUrl ? (
            <a
              href={post.crossPostUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-brand-text hover:underline"
            >
              Also published here <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          ) : null}
        </div>
        {post.tags.length ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-md border bg-surface px-1.5 py-0.5 font-mono text-[0.7rem] text-muted-foreground"
              >
                #{tag}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      {post.coverImage ? (
        <div className="relative aspect-[2/1] overflow-hidden rounded-2xl border bg-muted">
          <Image
            src={post.coverImage.url}
            alt={post.coverImage.alt}
            fill
            preload
            fetchPriority="high"
            sizes="(min-width: 1100px) 1050px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
        {toc.length > 1 ? (
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <TableOfContents items={toc} />
            </div>
          </aside>
        ) : (
          <div className="hidden lg:block" />
        )}
        <div className="max-w-3xl min-w-0">
          <PostContent blocks={blocks} />
        </div>
      </div>

      {post.related.length ? (
        <section className="flex flex-col gap-4 border-t pt-10">
          <h2 className="font-mono text-xs tracking-widest text-brand-text uppercase">
            Related posts
          </h2>
          <ul className="grid gap-6 md:grid-cols-3">
            {post.related.map((p) => (
              <li key={p._id}>
                <PostCard post={p} compact />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function PostSkeleton() {
  return (
    <div className="container-page flex flex-col gap-6 py-12">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

export default function PostPage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostArticle params={params} />
    </Suspense>
  );
}
