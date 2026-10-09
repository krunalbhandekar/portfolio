"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ListChecks, Search } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import type { BuiltFeature } from "@/lib/data/types";

const AREA_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  "full-stack": "Full Stack",
  database: "Database",
  devops: "DevOps",
  integration: "Integration",
};
const selectClass =
  "h-9 rounded-lg border border-input bg-surface px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** Searchable, filterable table of features built across projects (portfolio.md §3.9). */
export function BuiltExplorer({
  features,
  skillNames,
}: {
  features: BuiltFeature[];
  skillNames: [string, string][];
}) {
  const names = useMemo(() => new Map(skillNames), [skillNames]);
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");
  const [tech, setTech] = useState("");

  const areas = useMemo(() => [...new Set(features.map((f) => f.area))], [features]);
  const techs = useMemo(
    () =>
      [...new Set(features.flatMap((f) => f.technologies))].sort((a, b) =>
        (names.get(a) ?? a).localeCompare(names.get(b) ?? b),
      ),
    [features, names],
  );
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return features.filter((f) => {
      if (area && f.area !== area) return false;
      if (tech && !f.technologies.includes(tech)) return false;
      if (!needle) return true;
      return [
        f.feature,
        f.description,
        f.project?.title ?? "",
        ...f.technologies.map((t) => names.get(t) ?? t),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [features, q, area, tech, names]);

  const hrefFor = (f: BuiltFeature) =>
    f.caseStudySlug
      ? `/case-studies/${f.caseStudySlug}`
      : f.project
        ? `/projects/${f.project.slug}`
        : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Search features"
            className="h-9 bg-surface pl-8"
            placeholder="Search features…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by area"
          className={selectClass}
          value={area}
          onChange={(e) => setArea(e.target.value)}
        >
          <option value="">All areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {AREA_LABELS[a] ?? a}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by technology"
          className={selectClass}
          value={tech}
          onChange={(e) => setTech(e.target.value)}
        >
          <option value="">All technologies</option>
          {techs.map((t) => (
            <option key={t} value={t}>
              {names.get(t) ?? t}
            </option>
          ))}
        </select>
        <p className="ml-auto font-mono text-xs text-muted-foreground" aria-live="polite">
          {rows.length} of {features.length}
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={features.length ? "No features match" : "Coming soon"}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">Features built across projects</caption>
            <thead>
              <tr className="border-b text-left font-mono text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3 font-normal">Feature</th>
                <th className="px-4 py-3 font-normal">Project</th>
                <th className="px-4 py-3 font-normal">Technology</th>
                <th className="px-4 py-3 font-normal">Area</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => {
                const href = hrefFor(f);
                return (
                  <tr key={f._id} className="border-b align-top last:border-0">
                    <td className="px-4 py-3">
                      {href ? (
                        <Link href={href} className="font-medium hover:underline">
                          {f.feature}
                        </Link>
                      ) : (
                        <span className="font-medium">{f.feature}</span>
                      )}
                      {f.description ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">{f.description}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{f.project?.title ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {f.technologies.map((t) => names.get(t) ?? t).join(" + ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border bg-surface px-2 py-0.5 font-mono text-[0.7rem]">
                        {AREA_LABELS[f.area] ?? f.area}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
