"use client";

import { LinesField, RepeaterField, TextField, TextareaField } from "../kit/fields";
import { FormSection } from "../kit/layout";
import { RichTextField } from "../kit/rich-text-field";
import { MediaField } from "../media/media-fields";
import type { SingletonConfig } from "../resources/types";

function AboutFields() {
  return (
    <>
      <FormSection title="Story">
        <TextField name="headline" label="Headline" wide />
        <RichTextField
          name="story"
          label="Professional story"
          description="How you got here, what you enjoy solving, how you work."
        />
        <MediaField name="portrait" label="Portrait" folder="portfolio/about" />
        <LinesField
          name="domains"
          label="Domains worked in"
          description="One per line, e.g. Fintech, B2B commerce."
        />
      </FormSection>

      <FormSection
        title="Career journey"
        description="Non-linear path, e.g. Mechanical Engineering → Software → Full-Stack."
      >
        <RepeaterField
          name="journey"
          label="Steps"
          max={20}
          addLabel="Add step"
          newItem={() => ({ period: "", title: "", description: "" })}
          render={(prefix) => (
            <>
              <TextField
                name={`${prefix}.period`}
                label="Period"
                required
                placeholder="2017 — 2021"
              />
              <TextField name={`${prefix}.title`} label="Title" required />
              <TextareaField
                name={`${prefix}.description`}
                label="Description"
                maxLength={500}
                wide
              />
            </>
          )}
        />
      </FormSection>

      <FormSection title="Education">
        <RepeaterField
          name="education"
          label="Entries"
          max={10}
          addLabel="Add education"
          newItem={() => ({
            institution: "",
            degree: "",
            field: "",
            startYear: "",
            endYear: "",
            description: "",
          })}
          render={(prefix) => (
            <>
              <TextField name={`${prefix}.institution`} label="Institution" required />
              <TextField name={`${prefix}.degree`} label="Degree" />
              <TextField name={`${prefix}.field`} label="Field of study" />
              <div className="grid grid-cols-2 gap-3">
                <TextField name={`${prefix}.startYear`} label="Start" placeholder="2017" />
                <TextField name={`${prefix}.endYear`} label="End" placeholder="2021" />
              </div>
              <TextareaField name={`${prefix}.description`} label="Notes" maxLength={500} wide />
            </>
          )}
        />
      </FormSection>

      <FormSection title="How I work" description="Values and engineering principles.">
        <RepeaterField
          name="values"
          label="Values"
          max={10}
          addLabel="Add value"
          newItem={() => ({ title: "", description: "" })}
          render={(prefix) => (
            <>
              <TextField name={`${prefix}.title`} label="Title" required />
              <TextareaField name={`${prefix}.description`} label="Description" maxLength={300} />
            </>
          )}
        />
      </FormSection>
    </>
  );
}

export const aboutConfig: SingletonConfig = {
  apiPath: "about",
  title: "About",
  description: "Your story, journey, education and working style.",
  defaults: {
    headline: "",
    story: "",
    portrait: null,
    education: [],
    journey: [],
    values: [],
    domains: [],
  },
  Fields: AboutFields,
};
