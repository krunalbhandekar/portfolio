import { Router } from "express";
import mongoose from "mongoose";
import { crudRouter } from "../lib/crud/crud-router.js";
import { singletonRouter } from "../lib/crud/singleton-router.js";
import { About } from "./about/about.model.js";
import { aboutInput } from "./about/about.schema.js";
import { Capability } from "./capabilities/capability.model.js";
import { capabilityInput } from "./capabilities/capability.schema.js";
import { Experience } from "./experiences/experience.model.js";
import { experienceInput } from "./experiences/experience.schema.js";
import { Homepage } from "./homepage/homepage.model.js";
import { HOMEPAGE_SECTIONS, homepageInput } from "./homepage/homepage.schema.js";
import { Project } from "./projects/project.model.js";
import { projectInput } from "./projects/project.schema.js";
import { Resume } from "./resumes/resume.model.js";
import { resumeInput } from "./resumes/resume.schema.js";
import { SiteSettings } from "./settings/settings.model.js";
import { settingsInput } from "./settings/settings.schema.js";
import { Skill } from "./skills/skill.model.js";
import { skillInput } from "./skills/skill.schema.js";

/**
 * Admin content API (portfolio.md §10). Mounted under /api/v1/admin, behind requireAdmin.
 * Cache tags here must match the tags the public site's fetchers use (Phase 4).
 */
export const contentRoutes = Router()
  .use(
    "/settings",
    singletonRouter({
      resource: "settings",
      label: "Site settings",
      model: SiteSettings,
      input: settingsInput,
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
      tags: ["settings"],
    }),
  )
  .use(
    "/homepage",
    singletonRouter({
      resource: "homepage",
      label: "Homepage",
      model: Homepage,
      input: homepageInput,
      defaults: {
        hero: { eyebrow: "$ whoami", headline: "", subheadline: "", positioning: "", stack: [] },
        ctas: [],
        stats: [],
        bento: [],
        expertise: [],
        sections: HOMEPAGE_SECTIONS.map((key) => ({ key, visible: true })),
        featuredProjectIds: [],
        nowSnippet: "",
      },
      tags: ["homepage"],
    }),
  )
  .use(
    "/about",
    singletonRouter({
      resource: "about",
      label: "About page",
      model: About,
      input: aboutInput,
      defaults: {
        headline: "",
        story: "",
        portrait: null,
        education: [],
        journey: [],
        values: [],
        domains: [],
      },
      tags: ["about"],
    }),
  )
  .use(
    "/experiences",
    crudRouter({
      resource: "experiences",
      model: Experience,
      input: experienceInput,
      labelField: "company",
      searchFields: ["company", "position", "technologies"],
      sortable: ["startDate", "company"],
      tags: () => ["experiences"],
    }),
  )
  .use(
    "/projects",
    crudRouter({
      resource: "projects",
      model: Project,
      input: projectInput,
      labelField: "title",
      searchFields: ["title", "summary", "technologies"],
      slugFrom: "title",
      sortable: ["title", "featured", "startDate"],
      tags: (doc, previous) => [
        "projects",
        `project:${String(doc.slug)}`,
        ...(previous && previous.slug !== doc.slug ? [`project:${String(previous.slug)}`] : []),
      ],
    }),
  )
  .use(
    "/skills",
    crudRouter({
      resource: "skills",
      model: Skill,
      input: skillInput,
      labelField: "name",
      searchFields: ["name", "category"],
      slugFrom: "name",
      sortable: ["category"],
      tags: (doc) => ["skills", `skill:${String(doc.slug)}`],
    }),
  )
  .use(
    "/capabilities",
    crudRouter({
      resource: "capabilities",
      model: Capability,
      input: capabilityInput,
      labelField: "name",
      searchFields: ["name", "description"],
      tags: () => ["skills"],
    }),
  )
  .use(
    "/resumes",
    crudRouter({
      resource: "resumes",
      model: Resume,
      input: resumeInput,
      labelField: "label",
      searchFields: ["label", "slug"],
      slugFrom: "label",
      tags: () => ["resumes"],
      // Only one resume can be the default download.
      afterSave: async (doc) => {
        if (doc.isDefault) {
          await Resume.updateMany(
            { _id: mongoose.trusted({ $ne: doc._id }), isDefault: true },
            { $set: { isDefault: false } },
          );
        }
      },
    }),
  );
