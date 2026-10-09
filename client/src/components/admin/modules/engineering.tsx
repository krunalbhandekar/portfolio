"use client";

import { useWatch } from "react-hook-form";
import { slugify } from "@/lib/slug";
import { RepeaterField, SelectField, SwitchField, TextField, TextareaField } from "../kit/fields";
import { FormSection } from "../kit/layout";
import { MermaidField } from "../kit/mermaid-field";
import { ReferenceSelectField } from "../kit/reference-fields";
import { RichTextField } from "../kit/rich-text-field";
import type { ResourceConfig } from "../resources/types";
import { API_AUTH, ENGINEERING_TYPES, HTTP_METHODS, labelFor, PARAM_LOCATIONS } from "./options";

const COPY: Record<string, { title: string; content: string }> = {
  architecture: { title: "Title", content: "Explanation" },
  api: { title: "Endpoint name", content: "What it does" },
  database: { title: "Title", content: "Collections, relationships, indexes, modelling decisions" },
  devops: { title: "Title", content: "Pipeline and what you personally handled" },
  decision: { title: "Question (e.g. “Why MongoDB?”)", content: "Answer" },
};

function EngineeringFields() {
  const [type, title] = useWatch({ name: ["type", "title"] }) as [string, string];
  const copy = COPY[type] ?? COPY.architecture!;
  const showDiagram = type !== "decision" && type !== "api";

  return (
    <>
      <FormSection title="Entry">
        <SelectField name="type" label="Type" options={ENGINEERING_TYPES} required />
        <ReferenceSelectField name="projectId" label="Related project" apiPath="projects" />
        <TextField name="title" label={copy.title} required wide />
        <TextField
          name="slug"
          label="Anchor slug"
          placeholder={slugify(title || "") || "entry"}
          description="Used for /engineering#<slug> links."
        />
        {type !== "decision" ? (
          <TextareaField name="summary" label="Summary" maxLength={300} wide />
        ) : null}
        <RichTextField name="content" label={copy.content} />
      </FormSection>

      {showDiagram ? (
        <FormSection title="Diagram">
          <MermaidField name="diagram" label="Mermaid diagram" />
        </FormSection>
      ) : null}

      {type === "api" ? (
        <>
          <FormSection title="Endpoint">
            <SelectField name="api.method" label="Method" options={HTTP_METHODS} />
            <SelectField name="api.auth" label="Auth" options={API_AUTH} />
            <TextField name="api.path" label="Path" placeholder="/api/v1/orders/:id" wide />
          </FormSection>
          <FormSection title="Parameters">
            <RepeaterField
              name="api.params"
              label="Parameters"
              max={30}
              addLabel="Add parameter"
              newItem={() => ({
                name: "",
                location: "query",
                type: "string",
                required: false,
                description: "",
              })}
              render={(prefix) => (
                <>
                  <TextField name={`${prefix}.name`} label="Name" required />
                  <SelectField name={`${prefix}.location`} label="In" options={PARAM_LOCATIONS} />
                  <TextField name={`${prefix}.type`} label="Type" placeholder="string" />
                  <SwitchField name={`${prefix}.required`} label="Required" />
                  <TextField name={`${prefix}.description`} label="Description" wide />
                </>
              )}
            />
          </FormSection>
          <FormSection
            title="Examples"
            description="JSON is syntax-highlighted on the public page."
          >
            <TextareaField
              name="api.requestExample"
              label="Request example"
              rows={8}
              maxLength={5000}
              className="font-mono"
              wide
            />
            <TextareaField
              name="api.responseExample"
              label="Response example"
              rows={8}
              maxLength={5000}
              className="font-mono"
              wide
            />
            <RepeaterField
              name="api.statusCodes"
              label="Status codes"
              max={15}
              addLabel="Add status code"
              newItem={() => ({ code: "", description: "" })}
              render={(prefix) => (
                <>
                  <TextField name={`${prefix}.code`} label="Code" required placeholder="200" />
                  <TextField name={`${prefix}.description`} label="Meaning" placeholder="OK" />
                </>
              )}
            />
          </FormSection>
        </>
      ) : null}
    </>
  );
}

export const engineeringConfig: ResourceConfig = {
  key: "engineering",
  apiPath: "engineering",
  title: "Engineering",
  singular: "Engineering entry",
  description: "Architecture, API showcase, database design, DevOps and decision FAQ entries.",
  labelField: "title",
  columns: [
    { header: "Title", cell: (d) => String(d.title), sortKey: "title" },
    { header: "Type", cell: (d) => labelFor(ENGINEERING_TYPES, d.type), sortKey: "type" },
  ],
  defaults: {
    type: "architecture",
    title: "",
    slug: "",
    summary: "",
    content: "",
    diagram: "",
    projectId: null,
    api: {
      method: "GET",
      path: "",
      auth: "none",
      params: [],
      requestExample: "",
      responseExample: "",
      statusCodes: [],
    },
  },
  Fields: EngineeringFields,
};
