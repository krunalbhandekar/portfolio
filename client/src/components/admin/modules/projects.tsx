"use client";

import { useWatch } from "react-hook-form";
import { Callout } from "@/components/shared/callout";
import { slugify } from "@/lib/slug";
import {
  DateField,
  LinesField,
  NumberField,
  RepeaterField,
  SelectField,
  SwitchField,
  TagsField,
  TextField,
  TextareaField,
} from "../kit/fields";
import { FlowField } from "../kit/flow-field";
import { FormSection } from "../kit/layout";
import { ReferenceSelectField } from "../kit/reference-fields";
import { RichTextField } from "../kit/rich-text-field";
import { GalleryField, MediaField } from "../media/media-fields";
import type { ResourceConfig } from "../resources/types";
import { PROJECT_CATEGORIES, PROJECT_STATUSES, PROJECT_TYPES, labelFor } from "./options";
import { useSkillSuggestions } from "./use-skill-suggestions";

function ProjectFields() {
  const skills = useSkillSuggestions();
  const [slug, title, type, confidential] = useWatch({
    name: ["slug", "title", "type", "confidential"],
  }) as [string, string, string, boolean];
  const folderSlug = slugify(slug || title || "");
  const folder = folderSlug ? `portfolio/projects/${folderSlug}` : "portfolio/projects";

  return (
    <>
      <FormSection title="Overview">
        <TextField name="title" label="Title" required />
        <TextField
          name="slug"
          label="URL slug"
          description="Generated from the title if empty."
          placeholder={slugify(title || "") || "my-project"}
        />
        <TextareaField name="summary" label="One-line summary" required maxLength={300} wide />
        <SelectField name="category" label="Category" options={PROJECT_CATEGORIES} required />
        <SelectField name="type" label="Type" options={PROJECT_TYPES} required />
        <SelectField name="projectStatus" label="Project status" options={PROJECT_STATUSES} />
        <TextField name="role" label="Your role" placeholder="Lead full-stack engineer" />
        <TextField name="duration" label="Duration" placeholder="8 months" />
        <NumberField name="teamSize" label="Team size" min={1} />
        <DateField name="startDate" label="Start date" />
        <DateField name="endDate" label="End date" />
        <TagsField
          name="technologies"
          label="Technologies"
          suggestions={skills}
          emptyHint="No skills yet. Add them under Skills in the sidebar."
          normalize={slugify}
          wide
        />
        <ReferenceSelectField
          name="experienceId"
          label="Built at (experience)"
          apiPath="experiences"
        />
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
          <SwitchField
            name="confidential"
            label="Confidential (NDA)"
            description="Professional work: no code, redacted visuals. (To feature a project, pick it in Homepage → Featured projects.)"
            className="flex-1"
          />
        </div>
        {type === "professional" && confidential ? (
          <Callout variant="warning" title="Confidential project" className="sm:col-span-2">
            Only upload screenshots that were redacted before upload, and leave the repository link
            empty.
          </Callout>
        ) : null}
      </FormSection>

      <FormSection title="Media">
        <MediaField
          name="thumbnail"
          label="Thumbnail"
          folder={folder}
          description="Card image, 16:9 works best."
          wide
        />
        <GalleryField
          name="gallery"
          label="Screenshots"
          folder={folder}
          description="Shown in the lightbox gallery, in this order."
        />
        <TextField name="videoUrl" label="Demo video (YouTube / Loom)" type="url" wide />
      </FormSection>

      <FormSection title="Links">
        <TextField name="liveUrl" label="Live demo" type="url" />
        <TextField name="repoUrl" label="Repository" type="url" />
        {type === "personal" ? (
          <>
            <TextField name="demoCredentials.username" label="Demo username" />
            <TextField name="demoCredentials.password" label="Demo password" />
            <TextField name="demoCredentials.note" label="Demo note" wide />
          </>
        ) : null}
      </FormSection>

      <FormSection title="Problem & solution">
        <RichTextField name="problem" label="Problem" description="The business / user problem." />
        <RichTextField name="solution" label="Solution" description="What was built." />
        <LinesField
          name="contributions"
          label="Your contribution"
          description="Exactly what you did, one per line."
          wide
        />
        <LinesField name="features" label="Features" wide />
      </FormSection>

      <FormSection title="Impact metrics" description="Only real, verifiable numbers.">
        <RepeaterField
          name="metrics"
          label="Metrics"
          max={8}
          addLabel="Add metric"
          newItem={() => ({ label: "", value: "" })}
          render={(prefix) => (
            <>
              <TextField name={`${prefix}.value`} label="Value" required placeholder="60%" />
              <TextField
                name={`${prefix}.label`}
                label="Label"
                required
                placeholder="Faster API responses"
              />
            </>
          )}
        />
      </FormSection>

      <FormSection title="Architecture">
        <RichTextField name="architecture.description" label="Description" />
        <TextareaField
          name="architecture.diagram"
          label="Mermaid diagram"
          rows={6}
          maxLength={10000}
          description="Optional Mermaid source, rendered on the project page."
          wide
        />
        <MediaField name="architecture.image" label="Diagram image" folder={folder} wide />
      </FormSection>

      <FormSection
        title="Interactive architecture diagram"
        description="Optional. Shown on the project page with zoom/pan; visitors click a component to read what it does."
      >
        <FlowField name="architecture.flow" />
      </FormSection>

      <FormSection title="Engineering challenges">
        <RepeaterField
          name="challenges"
          label="Challenge → Solution → Result"
          max={12}
          addLabel="Add challenge"
          newItem={() => ({ challenge: "", solution: "", result: "" })}
          render={(prefix) => (
            <>
              <TextareaField
                name={`${prefix}.challenge`}
                label="Challenge"
                required
                maxLength={500}
                wide
              />
              <TextareaField
                name={`${prefix}.solution`}
                label="Solution"
                required
                maxLength={1000}
                wide
              />
              <TextareaField name={`${prefix}.result`} label="Result" maxLength={500} wide />
            </>
          )}
        />
      </FormSection>

      <FormSection title="Key technical decisions">
        <RepeaterField
          name="decisions"
          label="Why X over Y"
          max={12}
          addLabel="Add decision"
          newItem={() => ({ question: "", answer: "" })}
          render={(prefix) => (
            <>
              <TextField
                name={`${prefix}.question`}
                label="Question"
                required
                wide
                placeholder="Why MongoDB over PostgreSQL?"
              />
              <TextareaField
                name={`${prefix}.answer`}
                label="Answer"
                required
                maxLength={1500}
                wide
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

export const projectsConfig: ResourceConfig = {
  key: "projects",
  apiPath: "projects",
  title: "Projects",
  singular: "Project",
  description: "Professional and personal projects with full engineering detail.",
  labelField: "title",
  previewPath: (doc) => (doc.slug ? `/projects/${String(doc.slug)}` : null),
  columns: [
    {
      header: "Title",
      sortKey: "title",
      cell: (d) => String(d.title),
    },
    { header: "Category", cell: (d) => labelFor(PROJECT_CATEGORIES, d.category) },
    {
      header: "Type",
      cell: (d) => (d.type === "professional" ? "Professional" : "Personal"),
      className: "hidden md:table-cell",
    },
    {
      header: "Slug",
      cell: (d) => (
        <span className="font-mono text-xs text-muted-foreground">/{String(d.slug)}</span>
      ),
      className: "hidden lg:table-cell",
    },
  ],
  defaults: {
    title: "",
    slug: "",
    summary: "",
    category: "full-stack",
    type: "professional",
    role: "",
    duration: "",
    startDate: null,
    endDate: null,
    teamSize: null,
    projectStatus: "completed",
    technologies: [],
    confidential: false,
    thumbnail: null,
    gallery: [],
    videoUrl: "",
    liveUrl: "",
    repoUrl: "",
    demoCredentials: { username: "", password: "", note: "" },
    problem: "",
    solution: "",
    contributions: [],
    features: [],
    architecture: {
      description: "",
      diagram: "",
      image: null,
      flow: { nodes: [], edges: [] },
    },
    challenges: [],
    decisions: [],
    metrics: [],
    experienceId: null,
    seo: { title: "", description: "", noindex: false },
  },
  Fields: ProjectFields,
};
