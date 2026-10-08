"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { slugify } from "@/lib/slug";
import { RepeaterField, SelectField, TagsField, TextField, TextareaField } from "../kit/fields";
import { FormSection } from "../kit/layout";
import { ReferenceListField } from "../kit/reference-fields";
import type { SingletonConfig } from "../resources/types";
import {
  BENTO_KINDS,
  BENTO_SIZES,
  CTA_VARIANTS,
  EXPERTISE_AREAS,
  HOMEPAGE_SECTION_LABELS,
} from "./options";
import { useSkillSuggestions } from "./use-skill-suggestions";

const SECTION_KEYS = Object.keys(HOMEPAGE_SECTION_LABELS);

/** Show/hide and reorder homepage sections (portfolio.md §4 #12). */
function SectionsEditor() {
  const { control, watch, setValue } = useFormContext();
  const { fields, move } = useFieldArray({ control, name: "sections" });
  return (
    <ol className="flex flex-col gap-2 sm:col-span-2">
      {fields.map((field, index) => {
        const key = watch(`sections.${index}.key`) as string;
        const visible = Boolean(watch(`sections.${index}.visible`));
        return (
          <li
            key={field.id}
            className="flex items-center gap-3 rounded-xl border bg-surface px-3 py-2"
          >
            <span className="w-5 font-mono text-xs text-muted-foreground">{index + 1}</span>
            <span className="flex-1 text-sm">{HOMEPAGE_SECTION_LABELS[key] ?? key}</span>
            <Switch
              aria-label={`Show ${HOMEPAGE_SECTION_LABELS[key] ?? key}`}
              checked={visible}
              onCheckedChange={(checked) =>
                setValue(`sections.${index}.visible`, checked, { shouldDirty: true })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Move up"
              disabled={index === 0}
              onClick={() => move(index, index - 1)}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Move down"
              disabled={index === fields.length - 1}
              onClick={() => move(index, index + 1)}
            >
              <ArrowDown />
            </Button>
          </li>
        );
      })}
    </ol>
  );
}

function HomepageFields() {
  const skills = useSkillSuggestions();
  return (
    <>
      <FormSection title="Hero">
        <TextField name="hero.eyebrow" label="Eyebrow" placeholder="$ whoami" />
        <TextField name="hero.headline" label="Headline" placeholder="Your name" />
        <TextField
          name="hero.subheadline"
          label="Sub-headline"
          placeholder="Full-Stack Software Engineer"
          wide
        />
        <TextareaField name="hero.positioning" label="Positioning statement" maxLength={300} wide />
        <TagsField
          name="hero.stack"
          label="Primary stack chips"
          suggestions={skills}
          emptyHint="No skills yet. Add them under Skills in the sidebar."
          normalize={slugify}
          description="Up to 8; pick from your skills."
          wide
        />
      </FormSection>

      <FormSection title="Calls to action">
        <RepeaterField
          name="ctas"
          label="Buttons"
          max={4}
          addLabel="Add button"
          newItem={() => ({ label: "", href: "", variant: "outline" })}
          render={(prefix) => (
            <>
              <TextField name={`${prefix}.label`} label="Label" required />
              <TextField name={`${prefix}.href`} label="Link" required placeholder="/projects" />
              <SelectField name={`${prefix}.variant`} label="Style" options={CTA_VARIANTS} />
            </>
          )}
        />
      </FormSection>

      <FormSection title="Stats strip" description="Only numbers you can back up.">
        <RepeaterField
          name="stats"
          label="Stats"
          max={6}
          addLabel="Add stat"
          newItem={() => ({ value: "", label: "" })}
          render={(prefix) => (
            <>
              <TextField name={`${prefix}.value`} label="Value" required placeholder="4+" />
              <TextField
                name={`${prefix}.label`}
                label="Label"
                required
                placeholder="Years of experience"
              />
            </>
          )}
        />
      </FormSection>

      <FormSection title="Bento grid">
        <RepeaterField
          name="bento"
          label="Cards"
          max={8}
          addLabel="Add card"
          newItem={() => ({ kind: "custom", title: "", body: "", href: "", size: "sm" })}
          render={(prefix) => (
            <>
              <SelectField name={`${prefix}.kind`} label="Type" options={BENTO_KINDS} />
              <SelectField name={`${prefix}.size`} label="Size" options={BENTO_SIZES} />
              <TextField name={`${prefix}.title`} label="Title" />
              <TextField name={`${prefix}.href`} label="Link" placeholder="/projects/…" />
              <TextareaField name={`${prefix}.body`} label="Body" maxLength={300} wide />
            </>
          )}
        />
      </FormSection>

      <FormSection
        title="Featured projects"
        description="Shown on the homepage in this order (max 6)."
      >
        <ReferenceListField name="featuredProjectIds" label="Projects" apiPath="projects" max={6} />
      </FormSection>

      <FormSection title="Technical expertise">
        <RepeaterField
          name="expertise"
          label="Areas"
          max={6}
          addLabel="Add area"
          newItem={() => ({ area: "Frontend", summary: "", skills: [] })}
          render={(prefix) => (
            <>
              <SelectField name={`${prefix}.area`} label="Area" options={EXPERTISE_AREAS} />
              <TagsField
                name={`${prefix}.skills`}
                label="Skills"
                suggestions={skills}
                emptyHint="No skills yet. Add them under Skills in the sidebar."
                normalize={slugify}
              />
              <TextareaField name={`${prefix}.summary`} label="Summary" maxLength={300} wide />
            </>
          )}
        />
      </FormSection>

      <FormSection title="Currently building">
        <TextareaField name="nowSnippet" label="Now snippet" maxLength={200} wide />
      </FormSection>

      <FormSection
        title="Section order & visibility"
        description="Toggle and reorder the homepage sections."
      >
        <SectionsEditor />
      </FormSection>
    </>
  );
}

export const homepageConfig: SingletonConfig = {
  apiPath: "homepage",
  title: "Homepage",
  description: "Hero, calls to action, stats, bento cards and section layout.",
  defaults: {
    hero: { eyebrow: "$ whoami", headline: "", subheadline: "", positioning: "", stack: [] },
    ctas: [],
    stats: [],
    bento: [],
    expertise: [],
    sections: SECTION_KEYS.map((key) => ({ key, visible: true })),
    featuredProjectIds: [],
    nowSnippet: "",
  },
  Fields: HomepageFields,
};
