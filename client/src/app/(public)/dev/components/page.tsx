import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, FolderOpen } from "lucide-react";
import { FilterDemo } from "@/components/dev/interactive-demos";
import { Reveal } from "@/components/motion/reveal";
import { BentoCard } from "@/components/shared/bento-card";
import { Callout } from "@/components/shared/callout";
import { CodeBlock } from "@/components/shared/code-block";
import { EmptyState } from "@/components/shared/empty-state";
import { Kbd } from "@/components/shared/kbd";
import { Lightbox } from "@/components/shared/lightbox";
import { SectionHeader } from "@/components/shared/section-header";
import { Stat } from "@/components/shared/stat";
import { StatusBadge } from "@/components/shared/status-badge";
import { TechChip } from "@/components/shared/tech-chip";
import { Timeline, TimelineItem } from "@/components/shared/timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Internal design-system preview with mock data. Never served in production.
export const metadata: Metadata = {
  title: "Components",
  robots: { index: false, follow: false },
};

const screenshots = [1, 2, 3, 4].map((n) => ({
  src: `/mock/screenshot-${n}.svg`,
  alt: `Mock dashboard screenshot ${n}`,
  width: 1600,
  height: 900,
}));

const sampleCode = `
import { Router } from "express";
import { requireAdmin } from "../middlewares/auth";

export const projectRoutes = Router()
  .get("/", listPublishedProjects)
  .post("/", requireAdmin, validate(createProjectSchema), createProject);
`;

function DemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5 border-t py-10">
      <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}

export default function ComponentsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="container-page py-16">
      <SectionHeader
        as="h1"
        index="00"
        eyebrow="Design system"
        title="Components"
        description="Every Phase 1 building block, rendered with mock data. Toggle the theme and resize to 360px to check each one."
      />

      <div className="mt-12">
        <DemoSection title="Buttons & badges">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button size="icon" aria-label="Next">
              <ArrowRight />
            </Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Professional</Badge>
            <Badge variant="secondary">Personal</Badge>
            <Badge variant="outline">In progress</Badge>
            <StatusBadge text="Available for opportunities" />
            <span className="text-sm text-muted-foreground">
              Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search
            </span>
          </div>
        </DemoSection>

        <DemoSection title="Tech chips">
          <ul className="flex flex-wrap gap-2">
            {[
              ["react", "React"],
              ["nextjs", "Next.js"],
              ["node-js", "Node.js"],
              ["typescript", "TypeScript"],
              ["mongodb", "MongoDB"],
              ["docker", "Docker"],
              ["kubernetes", "Kubernetes"],
              ["aws", "AWS (no logo)"],
            ].map(([slug, label]) => (
              <li key={slug}>
                <TechChip slug={slug!} label={label!} href={`/skills/${slug}`} />
              </li>
            ))}
          </ul>
        </DemoSection>

        <DemoSection title="Section header">
          <SectionHeader
            index="01"
            eyebrow="Projects"
            title="Systems I've designed and shipped"
            description="Production work and side projects, with the problems, decisions and measurable impact behind each one."
          />
        </DemoSection>

        <DemoSection title="Bento grid & stats">
          <div className="grid auto-rows-[minmax(140px,auto)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BentoCard featured className="sm:col-span-2 lg:row-span-2">
              <p className="font-mono text-xs text-brand-text">Currently building</p>
              <h3 className="mt-2 text-xl font-semibold">CMS-driven portfolio</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Next.js on Vercel, Express on Render, MongoDB Atlas and Cloudinary.
              </p>
            </BentoCard>
            <BentoCard>
              <Stat value="4+" label="Years of experience" />
            </BentoCard>
            <BentoCard>
              <Stat value="20+" label="Projects delivered" />
            </BentoCard>
            <BentoCard className="sm:col-span-2">
              <p className="font-mono text-xs text-muted-foreground">Location</p>
              <p className="mt-2 font-medium">Pune, India · IST (UTC+5:30)</p>
            </BentoCard>
          </div>
        </DemoSection>

        <DemoSection title="Tag filter + stagger animation">
          <FilterDemo />
        </DemoSection>

        <DemoSection title="Timeline">
          <Timeline>
            <TimelineItem
              period="2023 — Present"
              title="Full-Stack Engineer"
              subtitle="Buyofuel"
              current
            >
              Built order management, RBAC and payment integrations across React and Node.js.
            </TimelineItem>
            <TimelineItem
              period="2021 — 2023"
              title="Software Developer"
              subtitle="Previous company"
            >
              Moved from frontend work into backend APIs and database design.
            </TimelineItem>
            <TimelineItem
              period="2017 — 2021"
              title="B.E. Mechanical Engineering"
              subtitle="University"
            />
          </Timeline>
        </DemoSection>

        <DemoSection title="Lightbox gallery">
          <Lightbox images={screenshots} title="Mock project screenshots" />
        </DemoSection>

        <DemoSection title="Code block (Shiki)">
          <CodeBlock
            code={sampleCode}
            lang="ts"
            filename="server/src/modules/projects/project.routes.ts"
          />
        </DemoSection>

        <DemoSection title="Callouts">
          <div className="grid gap-3 sm:grid-cols-2">
            <Callout variant="info" title="Note">
              Confidential client data is never shown.
            </Callout>
            <Callout variant="tip" title="Decision">
              MongoDB was chosen for flexible order schemas.
            </Callout>
            <Callout variant="warning" title="Trade-off">
              Render free tier sleeps after 15 minutes.
            </Callout>
            <Callout variant="success" title="Result">
              API response time reduced by 60%.
            </Callout>
          </div>
        </DemoSection>

        <DemoSection title="Empty state & skeleton">
          <div className="grid gap-4 sm:grid-cols-2">
            <EmptyState
              icon={FolderOpen}
              title="No projects match"
              description="Try a different category or clear the filters."
              action={<Button variant="outline">Clear filters</Button>}
            />
            <div className="flex flex-col gap-3 rounded-2xl border p-6">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </DemoSection>

        <DemoSection title="Scroll reveal">
          <Reveal>
            <BentoCard>
              <p className="text-sm text-muted-foreground">
                This card fades in once when scrolled into view (static with reduced motion).
              </p>
            </BentoCard>
          </Reveal>
        </DemoSection>
      </div>
    </div>
  );
}
