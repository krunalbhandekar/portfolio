import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import type { PostCard as PostCardData } from "@/lib/data/types";
import { formatDate } from "@/lib/format";

export function PostCard({ post, compact = false }: { post: PostCardData; compact?: boolean }) {
  return (
    <article className="group/post relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-foreground/20">
      {post.coverImage && !compact ? (
        <div className="relative aspect-[2/1] overflow-hidden border-b bg-muted">
          <Image
            src={post.coverImage.url}
            alt={post.coverImage.alt}
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover/post:scale-[1.02]"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className="flex flex-wrap items-center gap-2 font-mono text-[0.7rem] text-muted-foreground">
          {post.category ? <span className="text-brand-text">{post.category}</span> : null}
          {post.category && post.publishedAt ? <span aria-hidden="true">·</span> : null}
          {post.publishedAt ? (
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          ) : null}
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" /> {post.readingTime} min
          </span>
        </p>
        <h3 className="text-lg font-semibold tracking-tight text-balance">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        {compact ? null : <p className="text-sm text-muted-foreground">{post.excerpt}</p>}
        {post.tags.length ? (
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-2" aria-label="Tags">
            {post.tags.slice(0, 4).map((tag) => (
              <li
                key={tag}
                className="rounded-md border bg-surface px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground"
              >
                #{tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <ArrowUpRight
        className="absolute top-4 right-4 size-4 text-muted-foreground opacity-0 transition-opacity group-hover/post:opacity-100"
        aria-hidden="true"
      />
    </article>
  );
}
