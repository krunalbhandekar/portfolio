"use client";

import {
  ColorField,
  RepeaterField,
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
} from "../kit/fields";
import { FormSection } from "../kit/layout";
import { MediaField } from "../media/media-fields";
import type { SingletonConfig } from "../resources/types";
import { SOCIAL_PLATFORMS } from "./options";

function SettingsFields() {
  return (
    <>
      <FormSection title="Identity" description="Shown in the navbar, footer, metadata and resume.">
        <TextField name="name" label="Name" required />
        <TextField
          name="role"
          label="Role / title"
          required
          placeholder="Full-Stack Software Engineer"
        />
        <TextareaField name="tagline" label="Tagline" maxLength={160} wide />
        <MediaField name="avatar" label="Avatar / photo" folder="portfolio/brand" />
        <MediaField
          name="logo"
          label="Logo"
          folder="portfolio/brand"
          description="Optional; the KB monogram is used otherwise."
        />
      </FormSection>

      <FormSection title="Contact & location">
        <TextField name="email" label="Public email" type="email" />
        <TextField
          name="phone"
          label="Phone"
          type="tel"
          description="Optional; leave empty to hide."
        />
        <TextField name="location" label="Location" placeholder="Pune, India" />
        <TextField
          name="calendarUrl"
          label="Booking link"
          type="url"
          placeholder="https://cal.com/…"
          wide
        />
      </FormSection>

      <FormSection
        title="Availability"
        description="Badge in the hero, footer and contact page, with a pulsing dot in your accent colour."
      >
        <TextField
          name="availabilityText"
          label="Badge text"
          placeholder="Available for opportunities"
          maxLength={60}
          description="Leave empty to hide the badge everywhere."
          wide
        />
      </FormSection>

      <FormSection title="Theme">
        <ColorField
          name="accentColor"
          label="Accent colour"
          description="Used for highlights, links and the status dot."
        />
      </FormSection>

      <FormSection title="Social links">
        <RepeaterField
          name="socials"
          label="Profiles"
          max={10}
          addLabel="Add link"
          newItem={() => ({ platform: "github", label: "", url: "" })}
          render={(prefix) => (
            <>
              <SelectField
                name={`${prefix}.platform`}
                label="Platform"
                options={SOCIAL_PLATFORMS}
              />
              <TextField name={`${prefix}.label`} label="Label" required />
              <TextField
                name={`${prefix}.url`}
                label="URL"
                required
                wide
                placeholder="https://… or mailto:…"
              />
            </>
          )}
        />
      </FormSection>

      <FormSection title="Announcement banner">
        <SwitchField
          name="announcement.enabled"
          label="Show banner"
          description="A thin bar above the navbar."
          wide
        />
        <TextField name="announcement.text" label="Text" maxLength={160} />
        <TextField name="announcement.href" label="Link" placeholder="/blog/new-post" />
      </FormSection>

      <FormSection
        title="SEO defaults"
        description="Fallbacks for pages without their own SEO fields."
      >
        <TextField name="seo.title" label="Default title" maxLength={70} wide />
        <TextareaField name="seo.description" label="Default description" maxLength={160} wide />
        <MediaField
          name="seo.ogImage"
          label="Default share image"
          folder="portfolio/brand"
          description="1200×630 recommended."
          wide
        />
      </FormSection>
    </>
  );
}

export const settingsConfig: SingletonConfig = {
  apiPath: "settings",
  title: "Site settings",
  description: "Global details used across the whole site.",
  defaults: {
    name: "",
    role: "",
    tagline: "",
    location: "",
    email: "",
    phone: "",
    availabilityText: "",
    accentColor: "#34d399",
    socials: [],
    announcement: { enabled: false, text: "", href: "" },
    calendarUrl: "",
    logo: null,
    avatar: null,
    seo: { title: "", description: "", ogImage: null },
  },
  Fields: SettingsFields,
};
