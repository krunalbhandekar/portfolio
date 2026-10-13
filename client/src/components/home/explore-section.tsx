import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { BentoCard } from "@/components/shared/bento-card";
import { SectionHeader } from "@/components/shared/section-header";
import { mainNav } from "@/config/site";
import { cn } from "@/lib/utils";
import { ExploredMark } from "./explored-mark";

/** Wide cards on the first and last rows of the 4-column bento. */
const WIDE = new Set(["/projects", "/contact"]);

/** Home "Explore the site": every main section as a door, with a hook and explored state. */
export function ExploreSection({ index }: { index: string }) {
  return (
    <section className="container-page flex flex-col gap-8 py-16" aria-label="Explore the site">
      <Reveal>
        <SectionHeader
          index={index}
          eyebrow="Explore"
          title="There's more behind every door"
          description="Seven sections, each telling a different part of the story. See how many you can uncover."
        />
      </Reveal>
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mainNav.map((item, i) => (
          <StaggerItem key={item.href} className={cn(WIDE.has(item.href) && "lg:col-span-2")}>
            <BentoCard className="flex h-full min-h-40 flex-col gap-3 transition-[translate,border-color] duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <ExploredMark href={item.href} />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">
                <Link
                  href={item.href}
                  className="group/door inline-flex items-center gap-1.5 after:absolute after:inset-0"
                >
                  {item.label}
                  <ArrowUpRight
                    className="size-4 text-brand-text transition-transform duration-300 group-hover/door:translate-x-0.5 group-hover/door:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </h3>
              <p className="text-sm text-pretty text-muted-foreground">{item.teaser}</p>
            </BentoCard>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
