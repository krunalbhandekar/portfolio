"use client";

import { slugify } from "@/lib/slug";
import { NumberField, SelectField, TagsField, TextField, TextareaField } from "../kit/fields";
import { FormSection } from "../kit/layout";
import { ReferenceListField } from "../kit/reference-fields";
import type { ResourceConfig } from "../resources/types";
import { SKILL_CATEGORIES, labelFor } from "./options";
import { useSkillSuggestions } from "./use-skill-suggestions";

function SkillFields() {
  return (
    <FormSection title="Skill">
      <TextField name="name" label="Name" required />
      <TextField
        name="slug"
        label="Slug"
        description="Generated from the name if empty; used in /skills/<slug>."
      />
      <SelectField name="category" label="Category" options={SKILL_CATEGORIES} required />
      <TextField
        name="icon"
        label="Logo key"
        description="Tech-icon key (usually the slug), e.g. node-js."
      />
      <TextField
        name="levelLabel"
        label="Experience (in words)"
        placeholder="Daily use · Production experience"
        description="No percentages."
      />
      <NumberField name="years" label="Years" min={0} max={50} />
      <ReferenceListField name="projectIds" label="Projects using it" apiPath="projects" />
    </FormSection>
  );
}

export const skillsConfig: ResourceConfig = {
  key: "skills",
  apiPath: "skills",
  title: "Skills",
  singular: "Skill",
  description: "Technologies, grouped by category and linked to projects.",
  labelField: "name",
  columns: [
    { header: "Name", cell: (d) => String(d.name), sortKey: "name" },
    {
      header: "Category",
      cell: (d) => labelFor(SKILL_CATEGORIES, d.category),
      sortKey: "category",
    },
    {
      header: "Experience",
      cell: (d) => String(d.levelLabel || "—"),
      className: "hidden md:table-cell",
    },
  ],
  defaults: {
    name: "",
    slug: "",
    category: "frontend",
    icon: "",
    levelLabel: "",
    years: null,
    projectIds: [],
  },
  Fields: SkillFields,
};

function CapabilityFields() {
  const skills = useSkillSuggestions();
  return (
    <FormSection
      title="Capability"
      description="What you can actually do, e.g. “Payment integration”."
    >
      <TextField name="name" label="Name" required wide />
      <TextareaField name="description" label="Description" maxLength={400} wide />
      <TagsField
        name="relatedSkills"
        label="Related skills"
        suggestions={skills}
        normalize={slugify}
        wide
      />
    </FormSection>
  );
}

export const capabilitiesConfig: ResourceConfig = {
  key: "capabilities",
  apiPath: "capabilities",
  title: "Capabilities",
  singular: "Capability",
  description: "Technical capabilities shown on the skills page.",
  labelField: "name",
  columns: [
    { header: "Name", cell: (d) => String(d.name), sortKey: "name" },
    {
      header: "Skills",
      cell: (d) => (Array.isArray(d.relatedSkills) ? d.relatedSkills.length : 0),
      className: "hidden md:table-cell",
    },
  ],
  defaults: { name: "", description: "", relatedSkills: [] },
  Fields: CapabilityFields,
};
