"use client";

import { RepeaterField, SwitchField, TextField, TextareaField } from "../kit/fields";
import { FormSection } from "../kit/layout";
import { RichTextField } from "../kit/rich-text-field";
import type { SingletonConfig } from "../resources/types";

function Basics({ path, what }: { path: string; what: string }) {
  return (
    <>
      <FormSection
        title="Page"
        description={`Shown at ${path}. While switched off the page returns "not found" and isn't linked anywhere.`}
      >
        <SwitchField name="visible" label={`Show ${path} on the site`} wide />
        <TextField name="title" label="Heading" />
        <TextareaField name="intro" label="Intro" maxLength={300} description={what} wide />
      </FormSection>
    </>
  );
}

function Seo() {
  return (
    <FormSection title="SEO" description="Optional; defaults to the heading and intro.">
      <TextField name="seo.title" label="Meta title" maxLength={70} wide />
      <TextareaField name="seo.description" label="Meta description" maxLength={160} wide />
    </FormSection>
  );
}

function NowFields() {
  return (
    <>
      <Basics path="/now" what="One line under the heading." />
      <FormSection
        title="What I'm doing now"
        description="Building, learning, reading — keep it current."
      >
        <RichTextField name="content" label="Content" />
      </FormSection>
      <Seo />
    </>
  );
}

function UsesFields() {
  return (
    <>
      <Basics path="/uses" what="e.g. “The hardware, software and tools I use every day.”" />
      <FormSection title="Groups" description="e.g. Hardware, Editor, Terminal, Apps.">
        <RepeaterField
          name="sections"
          label="Groups"
          max={20}
          addLabel="Add group"
          newItem={() => ({ title: "", items: [] })}
          render={(prefix) => (
            <>
              <TextField name={`${prefix}.title`} label="Group title" required wide />
              <RepeaterField
                name={`${prefix}.items`}
                label="Items"
                max={40}
                addLabel="Add item"
                newItem={() => ({ name: "", description: "", url: "" })}
                render={(item) => (
                  <>
                    <TextField name={`${item}.name`} label="Name" required />
                    <TextField
                      name={`${item}.url`}
                      label="Link"
                      type="url"
                      placeholder="https://…"
                    />
                    <TextField name={`${item}.description`} label="Why / how" wide />
                  </>
                )}
              />
            </>
          )}
        />
      </FormSection>
      <Seo />
    </>
  );
}

function FaqFields() {
  return (
    <>
      <Basics path="/faq" what="Shown above the questions." />
      <FormSection
        title="Questions"
        description="Shown as an accordion, with FAQ structured data for search results."
      >
        <RepeaterField
          name="items"
          label="Questions"
          max={50}
          addLabel="Add question"
          newItem={() => ({ question: "", answer: "" })}
          render={(prefix) => (
            <>
              <TextField name={`${prefix}.question`} label="Question" required wide />
              <RichTextField name={`${prefix}.answer`} label="Answer" />
            </>
          )}
        />
      </FormSection>
      <Seo />
    </>
  );
}

const seo = { title: "", description: "" };

export const pageConfigs: Record<"now" | "uses" | "faq", SingletonConfig> = {
  now: {
    apiPath: "pages/now",
    resource: "pages.now",
    title: "Now page",
    description: "What you're focused on right now (/now).",
    defaults: { visible: false, title: "Now", intro: "", content: "", seo },
    Fields: NowFields,
  },
  uses: {
    apiPath: "pages/uses",
    resource: "pages.uses",
    title: "Uses page",
    description: "Your hardware, editor and tools (/uses).",
    defaults: { visible: false, title: "Uses", intro: "", sections: [], seo },
    Fields: UsesFields,
  },
  faq: {
    apiPath: "pages/faq",
    resource: "pages.faq",
    title: "FAQ page",
    description: "Frequently asked questions (/faq).",
    defaults: { visible: false, title: "FAQ", intro: "", items: [], seo },
    Fields: FaqFields,
  },
};
