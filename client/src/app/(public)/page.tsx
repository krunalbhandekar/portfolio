import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { TechChip } from "@/components/shared/tech-chip";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

// Phase 1 placeholder hero. Phase 4 replaces this with CMS-driven content (portfolio.md §3.1).
const stack = [
  { slug: "react", label: "React" },
  { slug: "node-js", label: "Node.js" },
  { slug: "typescript", label: "TypeScript" },
  { slug: "mongodb", label: "MongoDB" },
];

export default function Home() {
  return (
    <section className="container-page flex flex-1 flex-col justify-center gap-8 py-20 sm:py-28">
      <StatusBadge label={siteConfig.availability} />
      <div className="flex max-w-3xl flex-col gap-5">
        <p className="font-mono text-sm text-muted-foreground">
          <span className="text-brand-text">$</span> whoami
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          {siteConfig.name}
          <span className="block text-muted-foreground">{siteConfig.role}</span>
        </h1>
        <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
          My engineering journey: the systems I&apos;ve built, the problems I&apos;ve solved, the
          decisions I&apos;ve made, and the impact of my work.
        </p>
      </div>
      <ul className="flex flex-wrap gap-2" aria-label="Primary tech stack">
        {stack.map((tech) => (
          <li key={tech.slug}>
            <TechChip slug={tech.slug} label={tech.label} />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <Link href="/projects" className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}>
          View Projects <ArrowRight aria-hidden="true" />
        </Link>
        <Link
          href="/resume"
          prefetch={false}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4")}
        >
          <Download aria-hidden="true" /> Download Resume
        </Link>
        <Link
          href="/contact"
          className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "h-10 px-4")}
        >
          Contact Me
        </Link>
      </div>
    </section>
  );
}
