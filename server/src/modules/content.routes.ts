import { Router } from "express";
import mongoose from "mongoose";
import { crudRouter } from "../lib/crud/crud-router.js";
import { singletonRouter } from "../lib/crud/singleton-router.js";
import { sendSuccess } from "../utils/response.js";
import { About } from "./about/about.model.js";
import { aboutInput } from "./about/about.schema.js";
import { Achievement } from "./achievements/achievement.model.js";
import { achievementInput } from "./achievements/achievement.schema.js";
import { BuiltFeature } from "./built-features/built-feature.model.js";
import { builtFeatureInput } from "./built-features/built-feature.schema.js";
import { Capability } from "./capabilities/capability.model.js";
import { capabilityInput } from "./capabilities/capability.schema.js";
import { CaseStudy } from "./case-studies/case-study.model.js";
import { caseStudyInput, readingTimeMinutes } from "./case-studies/case-study.schema.js";
import { Certification } from "./certifications/certification.model.js";
import { certificationInput } from "./certifications/certification.schema.js";
import { EngineeringItem } from "./engineering/engineering.model.js";
import { engineeringInput } from "./engineering/engineering.schema.js";
import { Experience } from "./experiences/experience.model.js";
import { experienceInput } from "./experiences/experience.schema.js";
import { Homepage } from "./homepage/homepage.model.js";
import { HOMEPAGE_SECTIONS, homepageInput } from "./homepage/homepage.schema.js";
import { Post } from "./posts/post.model.js";
import { postInput, postReadingTime } from "./posts/post.schema.js";
import { Project } from "./projects/project.model.js";
import { projectInput } from "./projects/project.schema.js";
import { Resume } from "./resumes/resume.model.js";
import { resumeInput } from "./resumes/resume.schema.js";
import { SiteSettings } from "./settings/settings.model.js";
import { RECRUITER_DEFAULTS, settingsInput } from "./settings/settings.schema.js";
import { Skill } from "./skills/skill.model.js";
import { skillInput } from "./skills/skill.schema.js";
import { Testimonial } from "./testimonials/testimonial.model.js";
import { testimonialInput } from "./testimonials/testimonial.schema.js";

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
        recruiter: RECRUITER_DEFAULTS,
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
  )
  .use(
    "/case-studies",
    crudRouter({
      resource: "case-studies",
      model: CaseStudy,
      input: caseStudyInput,
      labelField: "title",
      searchFields: ["title", "summary"],
      slugFrom: "title",
      sortable: ["title", "featured"],
      transform: (data) => ({
        ...data,
        readingTime: readingTimeMinutes(data.sections as { content?: unknown }[]),
      }),
      // Project pages link to their case study, so they refresh too.
      tags: (doc, previous) => [
        "case-studies",
        "projects",
        `case-study:${String(doc.slug)}`,
        ...(previous && previous.slug !== doc.slug ? [`case-study:${String(previous.slug)}`] : []),
      ],
    }),
  )
  .use(
    "/engineering",
    crudRouter({
      resource: "engineering",
      model: EngineeringItem,
      input: engineeringInput,
      labelField: "title",
      searchFields: ["title", "summary", "type"],
      slugFrom: "title",
      sortable: ["type", "title"],
      tags: () => ["engineering"],
    }),
  )
  .use(
    "/built-features",
    crudRouter({
      resource: "built-features",
      model: BuiltFeature,
      input: builtFeatureInput,
      labelField: "feature",
      searchFields: ["feature", "description", "area", "technologies"],
      sortable: ["feature", "area"],
      tags: () => ["built"],
    }),
  )
  // Visitor submissions waiting for review (sidebar badge). Registered before the CRUD `/:id`.
  .get("/testimonials/pending-count", async (_req, res) => {
    const count = await Testimonial.countDocuments({ source: "visitor", status: "draft" });
    sendSuccess(res, { count });
  })
  .use(
    "/testimonials",
    crudRouter({
      resource: "testimonials",
      model: Testimonial,
      input: testimonialInput,
      labelField: "name",
      searchFields: ["name", "company", "quote"],
      sortable: ["name", "company"],
      tags: () => ["testimonials"],
    }),
  )
  .use(
    "/achievements",
    crudRouter({
      resource: "achievements",
      model: Achievement,
      input: achievementInput,
      labelField: "title",
      searchFields: ["title", "description"],
      sortable: ["title", "date"],
      tags: () => ["achievements"],
    }),
  )
  .use(
    "/certifications",
    crudRouter({
      resource: "certifications",
      model: Certification,
      input: certificationInput,
      labelField: "title",
      searchFields: ["title", "institution"],
      sortable: ["title", "date", "type"],
      tags: () => ["certifications"],
    }),
  )
  .use(
    "/posts",
    crudRouter({
      resource: "posts",
      model: Post,
      input: postInput,
      labelField: "title",
      searchFields: ["title", "excerpt", "tags", "category"],
      slugFrom: "title",
      sortable: ["title", "publishedAt", "category"],
      transform: (data) => ({ ...data, readingTime: postReadingTime(data.content) }),
      // First publish stamps the publication date (kept on later edits/unpublish).
      afterSave: async (doc) => {
        if (doc.status === "published" && !doc.publishedAt) {
          await Post.updateOne({ _id: doc._id }, { $set: { publishedAt: new Date() } });
        }
      },
      tags: (doc, previous) => [
        "posts",
        `post:${String(doc.slug)}`,
        ...(previous && previous.slug !== doc.slug ? [`post:${String(previous.slug)}`] : []),
      ],
    }),
  );
