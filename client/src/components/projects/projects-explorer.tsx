"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { FolderSearch, Search } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { TagFilter } from "@/components/shared/tag-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProjectCard as ProjectCardData } from "@/lib/data/types";
import { CATEGORY_LABELS } from "@/lib/format";

/**
 * Animates filter/sort changes with the native View Transitions API (no animation library):
 * each card has a stable `view-transition-name`, so the browser morphs it to its new position.
 * Falls back to an instant update where unsupported or when the user prefers reduced motion.
 */
function withTransition(update: () => void) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduced) return update();
  document.startViewTransition(() => flushSync(update));
}

const selectClass =
  "h-9 rounded-lg border border-input bg-surface px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Sort = "featured" | "newest" | "title";

/**
 * Client-side filtering over the (small) published project list (portfolio.md §3.5).
 * Cards are rendered on the server and passed in as `cards`, so the card markup, images and
 * tech-logo registry never ship to the browser — only the filter logic does.
 */
export function ProjectsExplorer({
  projects,
  cards,
  skillNames: names,
}: {
  projects: ProjectCardData[];
  cards: Record<string, ReactNode>;
  skillNames: [string, string][];
}) {
  const skillNames = useMemo(() => new Map(names), [names]);
  const [category, setCategoryState] = useState<string | null>(null);
  const [type, setTypeState] = useState("");
  const [tech, setTechState] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSortState] = useState<Sort>("featured");
  // Search updates instantly while typing; discrete filter changes animate.
  const setCategory = (value: string | null) => withTransition(() => setCategoryState(value));
  const setType = (value: string) => withTransition(() => setTypeState(value));
  const setTech = (value: string) => withTransition(() => setTechState(value));
  const setSort = (value: Sort) => withTransition(() => setSortState(value));

  const categories = useMemo(
    () => [...new Set(projects.map((p) => p.category))].map((c) => CATEGORY_LABELS[c] ?? c),
    [projects],
  );
  const techOptions = useMemo(
    () =>
      [...new Set(projects.flatMap((p) => p.technologies))]
        .map((slug) => ({ slug, name: skillNames.get(slug) ?? slug }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [projects, skillNames],
  );

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = projects.filter((p) => {
      if (category && (CATEGORY_LABELS[p.category] ?? p.category) !== category) return false;
      if (type && p.type !== type) return false;
      if (tech && !p.technologies.includes(tech)) return false;
      if (!needle) return true;
      const haystack = [p.title, p.summary, ...p.technologies.map((t) => skillNames.get(t) ?? t)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
    if (sort === "title") return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "newest") {
      const time = (p: ProjectCardData) =>
        new Date(p.endDate ?? p.startDate ?? p.updatedAt).getTime();
      return [...filtered].sort((a, b) => time(b) - time(a));
    }
    return filtered; // API order: featured first, then manual order
  }, [projects, category, type, tech, q, sort, skillNames]);

  const filtersActive = Boolean(category || type || tech || q);
  const reset = () =>
    withTransition(() => {
      setCategoryState(null);
      setTypeState("");
      setTechState("");
      setQ("");
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {categories.length > 1 ? (
          <TagFilter
            label="Filter by category"
            tags={categories}
            value={category}
            onChange={setCategory}
          />
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              aria-label="Search projects"
              className="h-9 bg-surface pl-8"
              placeholder="Search title, tech, feature…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter by type"
            className={selectClass}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All types</option>
            <option value="professional">Professional</option>
            <option value="personal">Personal</option>
          </select>
          {techOptions.length ? (
            <select
              aria-label="Filter by technology"
              className={selectClass}
              value={tech}
              onChange={(e) => setTech(e.target.value)}
            >
              <option value="">All technologies</option>
              {techOptions.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : null}
          <select
            aria-label="Sort projects"
            className={selectClass}
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
          >
            <option value="featured">Featured first</option>
            <option value="newest">Newest</option>
            <option value="title">A–Z</option>
          </select>
          <p className="ml-auto font-mono text-xs text-muted-foreground" aria-live="polite">
            {visible.length} of {projects.length}
          </p>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={FolderSearch}
          title={projects.length ? "No projects match" : "Projects coming soon"}
          description={
            projects.length
              ? "Try a different filter or search."
              : "Case studies and project write-ups are on their way."
          }
          action={
            filtersActive ? (
              <Button variant="outline" onClick={reset}>
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <li
              key={project._id}
              style={{ viewTransitionName: `project-${project._id}` } as CSSProperties}
            >
              {cards[project._id]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
