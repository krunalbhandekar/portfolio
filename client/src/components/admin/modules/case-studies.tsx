"use client";

import { Star } from "lucide-react";
import { useWatch } from "react-hook-form";
import { slugify } from "@/lib/slug";
import { RepeaterField, SelectField, SwitchField, TextField, TextareaField } from "../kit/fields";
import { FormSection } from "../kit/layout";
import { ReferenceSelectField } from "../kit/reference-fields";
import { RichTextField } from "../kit/rich-text-field";
import { MediaField } from "../media/media-fields";
import type { ResourceConfig } from "../resources/types";
import { CASE_STUDY_SECTIONS, labelFor } from "./options";

const STARTER_SECTIONS = [
  "problem",
  "constraints",
  "architecture",
  "solution",
  "result",
  "learnings",
].map((type) => ({
  type,
  heading: "",
  content: "",
}));

function CaseStudyFields() {
  const title = useWatch({ name: "title" }) as string;
  return (
    <>
      <FormSection title="Overview">
        <TextField name="title" label="Title" required wide />
        <TextField
          name="slug"
          label="URL slug"
          placeholder={slugify(title || "") || "my-case-study"}
          description="Generated from the title if empty."
        />
        <ReferenceSelectField
          name="projectId"
          label="Project"
          apiPath="projects"
          description="Links the case study and the project page to each other."
        />
        <TextareaField name="summary" label="Summary" required maxLength={300} wide />
        <MediaField name="coverImage" label="Cover image" folder="portfolio/case-studies" wide />
        <SwitchField
          name="featured"
          label="Featured"
          description="Shown in the homepage's case-study section."
          wide
        />
      </FormSection>

      <FormSection
        title="Sections"
        description="Problem → Requirements → Constraints → Architecture → Database → API → Implementation → Challenges → Solution → Result → Learnings. Headings default to the section type."
      >
        <RepeaterField
          name="sections"
          label="Sections"
          max={20}
          addLabel="Add section"
          newItem={() => ({ type: "custom", heading: "", content: "" })}
          itemLabel={(i) => `Section ${i + 1}`}
          render={(prefix) => (
            <>
              <SelectField name={`${prefix}.type`} label="Type" options={CASE_STUDY_SECTIONS} />
              <TextField name={`${prefix}.heading`} label="Heading (optional)" />
              <RichTextField
                name={`${prefix}.content`}
                label="Content"
                mediaFolder="portfolio/case-studies"
              />
            </>
          )}
        />
      </FormSection>

      <FormSection title="SEO">
        <TextField name="seo.title" label="Meta title" maxLength={70} wide />
        <TextareaField name="seo.description" label="Meta description" maxLength={160} wide />
        <SwitchField name="seo.noindex" label="Hide from search engines" wide />
      </FormSection>
    </>
  );
}

export const caseStudiesConfig: ResourceConfig = {
  key: "case-studies",
  apiPath: "case-studies",
  title: "Case Studies",
  singular: "Case study",
  description: "Long-form deep dives for your top 4–6 projects.",
  labelField: "title",
  previewPath: (doc) => (doc.slug ? `/case-studies/${String(doc.slug)}` : null),
  columns: [
    {
      header: "Title",
      sortKey: "title",
      cell: (d) => (
        <span className="inline-flex items-center gap-1.5">
          {d.featured ? (
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-label="Featured" />
          ) : null}
          {String(d.title)}
        </span>
      ),
    },
    { header: "Sections", cell: (d) => (Array.isArray(d.sections) ? d.sections.length : 0) },
    {
      header: "Read",
      cell: (d) => <span className="font-mono text-xs">{String(d.readingTime ?? 1)} min</span>,
      className: "hidden md:table-cell",
    },
  ],
  defaults: {
    title: "",
    slug: "",
    summary: "",
    projectId: null,
    coverImage: null,
    featured: false,
    sections: STARTER_SECTIONS,
    seo: { title: "", description: "", noindex: false },
  },
  Fields: CaseStudyFields,
};

export const caseStudySectionLabel = (type: string) => labelFor(CASE_STUDY_SECTIONS, type);
