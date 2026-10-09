"use client";

import { CopyButton } from "@/components/shared/copy-button";
import { absoluteUrl } from "@/lib/seo";
import { SwitchField, TextField } from "../kit/fields";
import { FormSection } from "../kit/layout";
import { MediaField } from "../media/media-fields";
import type { ResourceConfig } from "../resources/types";

function ResumeFields() {
  return (
    <FormSection title="Resume">
      <TextField name="label" label="Label" required placeholder="Full-Stack" />
      <TextField
        name="slug"
        label="Variant key"
        description="Role-tailored link: /resume?v=<key> (e.g. backend). Generated from the label if empty."
      />
      <MediaField name="file" label="PDF" folder="portfolio/resumes" accept="pdf" required wide />
      <SwitchField
        name="isDefault"
        label="Default resume"
        description="Used by every “Download resume” button."
        wide
      />
      <TextField name="notes" label="Notes (private)" wide />
    </FormSection>
  );
}

export const resumesConfig: ResourceConfig = {
  key: "resume",
  apiPath: "resumes",
  title: "Resume",
  singular: "Resume",
  description: "PDF versions. Exactly one is the default download.",
  labelField: "label",
  columns: [
    { header: "Label", cell: (d) => String(d.label) },
    { header: "Default", cell: (d) => (d.isDefault ? "✓ Default" : "") },
    {
      header: "Downloads",
      cell: (d) => <span className="font-mono text-xs">{String(d.downloadCount ?? 0)}</span>,
    },
    {
      header: "Share link",
      className: "hidden md:table-cell",
      cell: (d) => {
        const url = absoluteUrl(d.isDefault ? "/resume" : `/resume?v=${String(d.slug)}`);
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            {d.isDefault ? "/resume" : `/resume?v=${String(d.slug)}`}
            <CopyButton
              value={url}
              label={`Copy link to ${String(d.label)} resume`}
              toast="Link copied"
            />
          </span>
        );
      },
    },
  ],
  defaults: { label: "", slug: "", file: null, isDefault: false, notes: "" },
  Fields: ResumeFields,
};
