"use client";

import { useWatch } from "react-hook-form";
import { slugify } from "@/lib/slug";
import {
  DateField,
  LinesField,
  SelectField,
  SwitchField,
  TagsField,
  TextField,
  TextareaField,
} from "../kit/fields";
import { FormSection } from "../kit/layout";
import { ReferenceListField } from "../kit/reference-fields";
import { MediaField } from "../media/media-fields";
import type { ResourceConfig } from "../resources/types";
import { EMPLOYMENT_TYPES, LOCATION_TYPES, labelFor } from "./options";
import { useSkillSuggestions } from "./use-skill-suggestions";

const formatMonth = (value: unknown) =>
  value
    ? new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(
        new Date(String(value)),
      )
    : "";

function ExperienceFields() {
  const skills = useSkillSuggestions();
  const isCurrent = useWatch({ name: "isCurrent" }) as boolean;
  return (
    <>
      <FormSection title="Role">
        <TextField name="company" label="Company" required />
        <TextField name="position" label="Position" required />
        <TextField name="companyUrl" label="Company website" type="url" />
        <MediaField name="companyLogo" label="Company logo" folder="portfolio/companies" />
        <SelectField name="employmentType" label="Employment type" options={EMPLOYMENT_TYPES} />
        <SelectField name="locationType" label="Work mode" options={LOCATION_TYPES} />
        <TextField name="location" label="Location" placeholder="Pune, India" />
      </FormSection>

      <FormSection title="Dates">
        <DateField name="startDate" label="Start date" required />
        {isCurrent ? <div /> : <DateField name="endDate" label="End date" />}
        <SwitchField name="isCurrent" label="I currently work here" wide />
      </FormSection>

      <FormSection title="Details">
        <TextareaField name="summary" label="Summary" maxLength={500} wide />
        <TagsField
          name="technologies"
          label="Technologies"
          suggestions={skills}
          emptyHint="No skills yet. Add them under Skills in the sidebar."
          normalize={slugify}
          wide
        />
        <LinesField name="responsibilities" label="Responsibilities" wide />
        <LinesField name="achievements" label="Achievements (impact first)" wide />
        <ReferenceListField name="projectIds" label="Linked projects" apiPath="projects" />
      </FormSection>
    </>
  );
}

export const experienceConfig: ResourceConfig = {
  key: "experience",
  apiPath: "experiences",
  title: "Experience",
  singular: "Role",
  description: "Jobs and roles for the career timeline.",
  labelField: "company",
  columns: [
    { header: "Company", cell: (d) => String(d.company), sortKey: "company" },
    { header: "Position", cell: (d) => String(d.position ?? "") },
    {
      header: "Period",
      sortKey: "startDate",
      cell: (d) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatMonth(d.startDate)} — {d.isCurrent ? "Present" : formatMonth(d.endDate)}
        </span>
      ),
    },
    {
      header: "Type",
      cell: (d) => labelFor(EMPLOYMENT_TYPES, d.employmentType),
      className: "hidden md:table-cell",
    },
  ],
  defaults: {
    company: "",
    companyUrl: "",
    companyLogo: null,
    position: "",
    employmentType: "full-time",
    location: "",
    locationType: "onsite",
    startDate: null,
    endDate: null,
    isCurrent: false,
    summary: "",
    technologies: [],
    responsibilities: [],
    achievements: [],
    projectIds: [],
  },
  Fields: ExperienceFields,
};
