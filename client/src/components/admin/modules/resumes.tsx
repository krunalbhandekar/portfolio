"use client";

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
        description="Shareable as /resume?v=<key> (Phase 6)."
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
  ],
  defaults: { label: "", slug: "", file: null, isDefault: false, notes: "" },
  Fields: ResumeFields,
};
