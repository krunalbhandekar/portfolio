"use client";

import { useState } from "react";
import { TagFilter } from "@/components/shared/tag-filter";
import { StaggerItem, Stagger } from "@/components/motion/reveal";
import { BentoCard } from "@/components/shared/bento-card";
import { TechChip } from "@/components/shared/tech-chip";

const categories = ["Full Stack", "Frontend", "Backend", "DevOps"] as const;

const projects = [
  { title: "Trading Platform", category: "Full Stack", stack: ["react", "node-js", "mongodb"] },
  { title: "Admin Panel", category: "Frontend", stack: ["nextjs", "typescript", "tailwind-css"] },
  {
    title: "Invoice Discounting API",
    category: "Backend",
    stack: ["node-js", "express", "mongodb"],
  },
  { title: "CI/CD Pipeline", category: "DevOps", stack: ["jenkins", "docker", "kubernetes"] },
];

/** Mock: filter + stagger behaviour, as the Projects page will use it in Phase 4. */
export function FilterDemo() {
  const [category, setCategory] = useState<string | null>(null);
  const visible = projects.filter((p) => !category || p.category === category);

  return (
    <div className="flex flex-col gap-4">
      <TagFilter
        label="Filter projects by category"
        tags={categories}
        value={category}
        onChange={setCategory}
      />
      <Stagger key={category ?? "all"} className="grid gap-4 sm:grid-cols-2">
        {visible.map((project) => (
          <StaggerItem key={project.title}>
            <BentoCard>
              <p className="font-mono text-xs text-muted-foreground">{project.category}</p>
              <h3 className="mt-1 font-medium">{project.title}</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {project.stack.map((slug) => (
                  <li key={slug}>
                    <TechChip slug={slug} label={slug} />
                  </li>
                ))}
              </ul>
            </BentoCard>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
