"use client";

import { useWatch } from "react-hook-form";
import { BadgeCheck } from "lucide-react";
import { TestimonialAvatar } from "@/components/testimonials/testimonial-avatar";
import { slugify } from "@/lib/slug";
import { DateField, SelectField, TagsField, TextField, TextareaField } from "../kit/fields";
import { FormSection } from "../kit/layout";
import { ReferenceSelectField } from "../kit/reference-fields";
import type { ResourceConfig } from "../resources/types";
import { CERTIFICATION_TYPES, FEATURE_AREAS, labelFor, RELATIONSHIPS } from "./options";
import { useSkillSuggestions } from "./use-skill-suggestions";

const formatDate = (value: unknown) =>
  value
    ? new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(
        new Date(String(value)),
      )
    : "—";

/* ---------------------------------------------------------------- What I Built */

function BuiltFeatureFields() {
  const skills = useSkillSuggestions();
  return (
    <FormSection
      title="Feature"
      description="One concrete thing you built, e.g. “RBAC”, “Order management”."
    >
      <TextField name="feature" label="Feature" required />
      <SelectField name="area" label="Area" options={FEATURE_AREAS} required />
      <ReferenceSelectField name="projectId" label="Project" apiPath="projects" />
      <TagsField
        name="technologies"
        label="Technologies"
        suggestions={skills}
        emptyHint="No skills yet. Add them under Skills in the sidebar."
        normalize={slugify}
      />
      <TextareaField name="description" label="Description" maxLength={300} wide />
    </FormSection>
  );
}

export const builtFeaturesConfig: ResourceConfig = {
  key: "built",
  apiPath: "built-features",
  title: "What I Built",
  singular: "Feature",
  description: "Concrete features across projects, shown in the searchable explorer.",
  labelField: "feature",
  columns: [
    { header: "Feature", cell: (d) => String(d.feature), sortKey: "feature" },
    { header: "Area", cell: (d) => labelFor(FEATURE_AREAS, d.area), sortKey: "area" },
    {
      header: "Tech",
      cell: (d) => (
        <span className="font-mono text-xs text-muted-foreground">
          {(d.technologies as string[] | undefined)?.join(", ")}
        </span>
      ),
      className: "hidden md:table-cell",
    },
  ],
  defaults: { feature: "", description: "", area: "backend", technologies: [], projectId: null },
  Fields: BuiltFeatureFields,
};

/* ---------------------------------------------------------------- Testimonials */

type Submitter = { email?: string; picture?: string; submittedAt?: string } | null;

/** Read-only details for testimonials a visitor submitted through /testimonials/write. */
function VisitorSubmission() {
  const source = useWatch({ name: "source" }) as string | undefined;
  const submittedBy = useWatch({ name: "submittedBy" }) as Submitter;
  const name = useWatch({ name: "name" }) as string;
  if (source !== "visitor" || !submittedBy) return null;
  return (
    <FormSection
      title="Submitted by a visitor"
      description="Verified with Google. Shows a “Verified via Google” mark and their Google photo publicly; the email is never shown."
    >
      <div className="flex items-center gap-3 sm:col-span-2">
        <TestimonialAvatar name={name || "?"} src={submittedBy.picture || null} />
        <div className="flex min-w-0 flex-col text-sm">
          <span className="flex items-center gap-1.5">
            <BadgeCheck className="size-4 text-brand-text" aria-hidden="true" />
            {submittedBy.email ? (
              <a href={`mailto:${submittedBy.email}`} className="truncate hover:underline">
                {submittedBy.email}
              </a>
            ) : (
              "Google account"
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            Submitted{" "}
            {submittedBy.submittedAt
              ? new Intl.DateTimeFormat(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(submittedBy.submittedAt))
              : ""}
            . Deleting it lets this account submit again.
          </span>
        </div>
      </div>
    </FormSection>
  );
}

function TestimonialFields() {
  return (
    <>
      <VisitorSubmission />
      <FormSection
        title="Testimonial"
        description="Publish to show it in the homepage carousel; unpublish to hide it."
      >
        <TextareaField name="quote" label="Quote" required rows={5} maxLength={1000} wide />
        <TextField name="name" label="Name" required />
        <SelectField name="relationship" label="Relationship" options={RELATIONSHIPS} />
        <TextField name="role" label="Role" placeholder="Engineering Manager" />
        <TextField name="company" label="Company" />
        <TextField name="linkedinUrl" label="LinkedIn URL" type="url" wide />
      </FormSection>
    </>
  );
}

export const testimonialsConfig: ResourceConfig = {
  key: "testimonials",
  apiPath: "testimonials",
  title: "Testimonials",
  singular: "Testimonial",
  description:
    "Quotes from managers, colleagues and clients. Visitors can also submit one at /testimonials/write; it arrives here as a draft.",
  labelField: "name",
  columns: [
    { header: "Name", cell: (d) => String(d.name), sortKey: "name" },
    { header: "Company", cell: (d) => String(d.company || "—"), sortKey: "company" },
    {
      header: "Source",
      cell: (d) =>
        d.source === "visitor" ? (
          <span className="inline-flex items-center gap-1 text-brand-text">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            Visitor
          </span>
        ) : (
          <span className="text-muted-foreground">Added by you</span>
        ),
    },
    {
      header: "Relationship",
      cell: (d) => labelFor(RELATIONSHIPS, d.relationship),
      className: "hidden md:table-cell",
    },
  ],
  defaults: {
    quote: "",
    name: "",
    role: "",
    company: "",
    relationship: "colleague",
    linkedinUrl: "",
    // Read-only (shown in the editor; the API ignores them on save).
    source: "admin",
    submittedBy: null,
  },
  Fields: TestimonialFields,
};

/* ---------------------------------------------------------------- Achievements */

function AchievementFields() {
  return (
    <FormSection title="Achievement" description="Measurable and verifiable only.">
      <TextField name="title" label="Title" required wide />
      <TextField name="metric" label="Headline metric" placeholder="60%, 10k+, 3x" />
      <DateField name="date" label="Date" />
      <ReferenceSelectField name="projectId" label="Project" apiPath="projects" />
      <TextareaField name="description" label="Description" maxLength={400} wide />
    </FormSection>
  );
}

export const achievementsConfig: ResourceConfig = {
  key: "achievements",
  apiPath: "achievements",
  title: "Achievements",
  singular: "Achievement",
  description: "Impact you can back up: modules built, processes automated, time saved.",
  labelField: "title",
  columns: [
    { header: "Title", cell: (d) => String(d.title), sortKey: "title" },
    {
      header: "Metric",
      cell: (d) => <span className="font-mono text-xs">{String(d.metric || "—")}</span>,
    },
    {
      header: "Date",
      cell: (d) => formatDate(d.date),
      sortKey: "date",
      className: "hidden md:table-cell",
    },
  ],
  defaults: { title: "", description: "", metric: "", date: null, projectId: null },
  Fields: AchievementFields,
};

/* ---------------------------------------------------------------- Certifications */

function CertificationFields() {
  return (
    <FormSection title="Certification / education item">
      <TextField name="title" label="Title" required wide />
      <SelectField name="type" label="Type" options={CERTIFICATION_TYPES} />
      <TextField name="institution" label="Institution / issuer" />
      <DateField name="date" label="Date" />
      <TextareaField name="description" label="Description" maxLength={300} wide />
      <TextField
        name="verifyUrl"
        label="Certificate link"
        type="url"
        placeholder="https://www.coursera.org/account/accomplishments/…"
        description="Public link to the certificate or its verification page (Coursera, Udemy, Credly, Google Drive…). Shown as “View certificate” on the About page."
        wide
      />
    </FormSection>
  );
}

export const certificationsConfig: ResourceConfig = {
  key: "certifications",
  apiPath: "certifications",
  title: "Certifications",
  singular: "Certification",
  description: "Certifications, courses, bootcamps, talks and awards.",
  labelField: "title",
  columns: [
    { header: "Title", cell: (d) => String(d.title), sortKey: "title" },
    { header: "Type", cell: (d) => labelFor(CERTIFICATION_TYPES, d.type), sortKey: "type" },
    {
      header: "Date",
      cell: (d) => formatDate(d.date),
      sortKey: "date",
      className: "hidden md:table-cell",
    },
  ],
  defaults: {
    title: "",
    institution: "",
    type: "certification",
    date: null,
    verifyUrl: "",
    description: "",
  },
  Fields: CertificationFields,
};
