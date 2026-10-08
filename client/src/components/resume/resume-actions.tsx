"use client";

import { Download, Printer } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Resume } from "@/lib/data/types";

/**
 * Downloads straight from Cloudinary (instant, even while the API sleeps) and counts it with a
 * fire-and-forget beacon.
 */
export function ResumeActions({ resume }: { resume: Resume | null }) {
  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      {resume ? (
        <a
          href={resume.downloadUrl}
          className={buttonVariants({ size: "lg" })}
          onClick={() => navigator.sendBeacon?.(`/api/v1/resume/${resume._id}/downloaded`)}
        >
          <Download aria-hidden="true" /> Download PDF
        </a>
      ) : null}
      <Button variant="outline" size="lg" onClick={() => window.print()}>
        <Printer aria-hidden="true" /> Print this page
      </Button>
    </div>
  );
}
