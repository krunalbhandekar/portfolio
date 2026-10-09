"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download, Printer } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Resume } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export type ResumeVersion = Resume & { isDefault: boolean };

/** Counts the download (server records the event) without delaying it. */
export const countDownload = (id: string) =>
  navigator.sendBeacon?.(`/api/v1/resume/${id}/downloaded`);

function Actions({ resumes, variant }: { resumes: ResumeVersion[]; variant: string | null }) {
  const resume = resumes.find((r) => r.slug === variant) ?? resumes[0] ?? null;
  return (
    <div className="flex flex-col gap-3 print:hidden">
      <div className="flex flex-wrap gap-3">
        {resume ? (
          <a
            href={resume.downloadUrl}
            className={buttonVariants({ size: "lg" })}
            onClick={() => countDownload(resume._id)}
          >
            <Download aria-hidden="true" />
            {resumes.length > 1 ? `Download ${resume.label} PDF` : "Download PDF"}
          </a>
        ) : null}
        <Button variant="outline" size="lg" onClick={() => window.print()}>
          <Printer aria-hidden="true" /> Print this page
        </Button>
      </div>
      {resumes.length > 1 ? (
        <nav aria-label="Resume versions" className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Versions:</span>
          {resumes.map((r) => (
            <Link
              key={r._id}
              href={r.isDefault ? "/resume" : `/resume?v=${r.slug}`}
              scroll={false}
              aria-current={r._id === resume?._id ? "true" : undefined}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono transition-colors",
                r._id === resume?._id
                  ? "border-foreground bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}

function WithVariant({ resumes }: { resumes: ResumeVersion[] }) {
  return <Actions resumes={resumes} variant={useSearchParams().get("v")} />;
}

/**
 * Downloads straight from Cloudinary (instant, even while the API sleeps). Role-tailored links
 * (`/resume?v=backend`, portfolio.md §4 #3) pick the version on the client, so the page itself
 * stays static.
 */
export function ResumeActions({ resumes }: { resumes: ResumeVersion[] }) {
  return (
    <Suspense fallback={<Actions resumes={resumes} variant={null} />}>
      <WithVariant resumes={resumes} />
    </Suspense>
  );
}
