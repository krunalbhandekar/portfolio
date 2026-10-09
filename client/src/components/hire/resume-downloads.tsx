"use client";

import { Download } from "lucide-react";
import { countDownload, type ResumeVersion } from "@/components/resume/resume-actions";
import { buttonVariants } from "@/components/ui/button";

/** Every published resume version (Full-stack, Backend…), each a direct Cloudinary download. */
export function ResumeDownloads({ resumes }: { resumes: ResumeVersion[] }) {
  if (!resumes.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {resumes.map((r, i) => (
        <li key={r._id}>
          <a
            href={r.downloadUrl}
            onClick={() => countDownload(r._id)}
            className={buttonVariants({ variant: i === 0 ? "default" : "outline" })}
          >
            <Download aria-hidden="true" />
            {resumes.length > 1 ? `${r.label} resume` : "Download resume"}
          </a>
        </li>
      ))}
    </ul>
  );
}
