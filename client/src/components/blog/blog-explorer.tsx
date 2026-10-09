"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { TagFilter } from "@/components/shared/tag-filter";
import { Input } from "@/components/ui/input";
import type { PostCard as PostCardData } from "@/lib/data/types";

/** Client-side tag filter + search over server-rendered post cards. */
export function BlogExplorer({
  posts,
  tags,
  cards,
}: {
  posts: PostCardData[];
  tags: string[];
  /** Server-rendered card per post, keyed by slug. */
  cards: Record<string, React.ReactNode>;
}) {
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return posts.filter((p) => {
      if (tag && !p.tags.includes(tag)) return false;
      const haystack = `${p.title} ${p.excerpt} ${p.category} ${p.tags.join(" ")}`.toLowerCase();
      return words.every((w) => haystack.includes(w));
    });
  }, [posts, tag, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {tags.length ? (
          <TagFilter label="Filter by tag" tags={tags} value={tag} onChange={setTag} />
        ) : (
          <span />
        )}
        <label className="relative w-full shrink-0 sm:w-64">
          <span className="sr-only">Search posts</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            className="h-9 pl-9"
          />
        </label>
      </div>
      <p className="sr-only" aria-live="polite">
        {visible.length} {visible.length === 1 ? "post" : "posts"}
      </p>
      {visible.length ? (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <li key={p.slug}>{cards[p.slug]}</li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No posts match" description="Try another tag or search term." />
      )}
    </div>
  );
}
