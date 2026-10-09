import mongoose, { Types } from "mongoose";
import { notFound } from "../../utils/app-error.js";
import { escapeRegex } from "../../utils/regex.js";
import { About } from "../about/about.model.js";
import { Achievement } from "../achievements/achievement.model.js";
import { BuiltFeature } from "../built-features/built-feature.model.js";
import { Capability } from "../capabilities/capability.model.js";
import { CaseStudy } from "../case-studies/case-study.model.js";
import { Certification } from "../certifications/certification.model.js";
import { EngineeringItem } from "../engineering/engineering.model.js";
import { Experience } from "../experiences/experience.model.js";
import { Homepage } from "../homepage/homepage.model.js";
import { HOMEPAGE_SECTIONS } from "../homepage/homepage.schema.js";
import { Project } from "../projects/project.model.js";
import { Resume } from "../resumes/resume.model.js";
import { SiteSettings } from "../settings/settings.model.js";
import { Skill } from "../skills/skill.model.js";
import { Testimonial } from "../testimonials/testimonial.model.js";

/*
 * Read-only data for the public site (portfolio.md §10). Only `published` content, and only
 * the fields pages need — internal fields (updatedBy, __v, private notes) never leave here.
 */

const PUBLISHED = { status: "published" } as const;

/** Preview endpoints pass `drafts: true` to also return unpublished documents. */
type ReadOptions = { drafts?: boolean };
const visible = (options: ReadOptions = {}) => (options.drafts ? {} : PUBLISHED);

const CASE_STUDY_CARD = {
  title: 1,
  slug: 1,
  summary: 1,
  coverImage: 1,
  readingTime: 1,
  featured: 1,
  projectId: 1,
  updatedAt: 1,
} as const;

const TESTIMONIAL_FIELDS = {
  quote: 1,
  name: 1,
  role: 1,
  company: 1,
  relationship: 1,
  photo: 1,
  linkedinUrl: 1,
} as const;
const INTERNAL = { updatedBy: 0, __v: 0, key: 0 } as const;

/** Fields for project cards (grid, featured, related). */
const PROJECT_CARD = {
  title: 1,
  slug: 1,
  summary: 1,
  category: 1,
  type: 1,
  technologies: 1,
  featured: 1,
  confidential: 1,
  thumbnail: 1,
  projectStatus: 1,
  startDate: 1,
  endDate: 1,
  order: 1,
  updatedAt: 1,
} as const;

export async function getSettings() {
  return SiteSettings.findOne({ key: "default" }, INTERNAL).lean();
}

export async function getHome() {
  const homepage = await Homepage.findOne({ key: "default" }, INTERNAL).lean();
  const featuredIds = (homepage?.featuredProjectIds ?? []).map(
    (id) => new Types.ObjectId(String(id)),
  );

  // Explicit selection keeps its order; otherwise fall back to projects flagged "featured".
  let featuredProjects;
  if (featuredIds.length) {
    const found = await Project.find(
      { ...PUBLISHED, _id: mongoose.trusted({ $in: featuredIds }) },
      PROJECT_CARD,
    ).lean();
    const byId = new Map(found.map((p) => [String(p._id), p]));
    featuredProjects = featuredIds.map((id) => byId.get(String(id))).filter(Boolean);
  } else {
    featuredProjects = await Project.find({ ...PUBLISHED, featured: true }, PROJECT_CARD)
      .sort({ order: 1 })
      .limit(6)
      .lean();
  }

  const [experiences, skills, about] = await Promise.all([
    Experience.find(PUBLISHED, {
      company: 1,
      position: 1,
      startDate: 1,
      endDate: 1,
      isCurrent: 1,
      companyLogo: 1,
      location: 1,
    })
      .sort({ isCurrent: -1, startDate: -1 })
      .limit(4)
      .lean(),
    Skill.find(PUBLISHED, { name: 1, slug: 1, icon: 1, category: 1 }).sort({ order: 1 }).lean(),
    About.findOne({ key: "default" }, { headline: 1, story: 1, portrait: 1 }).lean(),
  ]);
  const [caseStudies, testimonials] = await Promise.all([
    CaseStudy.find(PUBLISHED, CASE_STUDY_CARD).sort({ featured: -1, order: 1 }).limit(3).lean(),
    Testimonial.find(PUBLISHED, TESTIMONIAL_FIELDS).sort({ order: 1 }).limit(12).lean(),
  ]);

  return {
    homepage: homepage ?? { sections: HOMEPAGE_SECTIONS.map((key) => ({ key, visible: true })) },
    featuredProjects,
    experiences,
    skills,
    about,
    caseStudies,
    testimonials,
  };
}

export async function getAbout() {
  return About.findOne({ key: "default" }, INTERNAL).lean();
}

export async function getExperiences() {
  const experiences = await Experience.find(PUBLISHED, INTERNAL)
    .sort({ isCurrent: -1, startDate: -1 })
    .lean();
  const projectIds = experiences.flatMap((e) => e.projectIds ?? []);
  const projects = projectIds.length
    ? await Project.find(
        { ...PUBLISHED, _id: mongoose.trusted({ $in: projectIds }) },
        { title: 1, slug: 1 },
      ).lean()
    : [];
  const byId = new Map(projects.map((p) => [String(p._id), { title: p.title, slug: p.slug }]));
  return experiences.map(({ projectIds: ids, ...experience }) => ({
    ...experience,
    projects: (ids ?? []).map((id) => byId.get(String(id))).filter(Boolean),
  }));
}

type ProjectQuery = {
  category?: string;
  tech?: string;
  type?: string;
  q?: string;
  featured?: boolean;
};

export async function getProjects(query: ProjectQuery) {
  const filter: Record<string, unknown> = { ...PUBLISHED };
  if (query.category) filter.category = query.category;
  if (query.type) filter.type = query.type;
  if (query.tech) filter.technologies = query.tech;
  if (query.featured) filter.featured = true;
  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), "i");
    filter.$or = mongoose.trusted([
      { title: pattern },
      { summary: pattern },
      { technologies: pattern },
      { features: pattern },
    ]);
  }
  return Project.find(filter, PROJECT_CARD).sort({ featured: -1, order: 1 }).lean();
}

export async function getProject(slug: string, options: ReadOptions = {}) {
  const project = await Project.findOne({ ...visible(options), slug }, INTERNAL).lean();
  if (!project) throw notFound("Project not found");

  const [ordered, related, experience, caseStudy] = await Promise.all([
    Project.find(PUBLISHED, { title: 1, slug: 1 }).sort({ featured: -1, order: 1 }).lean(),
    Project.find(
      {
        ...PUBLISHED,
        _id: mongoose.trusted({ $ne: project._id }),
        $or: mongoose.trusted([
          { category: project.category },
          { technologies: mongoose.trusted({ $in: project.technologies ?? [] }) },
        ]),
      },
      PROJECT_CARD,
    )
      .sort({ featured: -1, order: 1 })
      .limit(3)
      .lean(),
    project.experienceId
      ? Experience.findOne(
          { ...PUBLISHED, _id: project.experienceId },
          { company: 1, position: 1, companyUrl: 1 },
        ).lean()
      : null,
    CaseStudy.findOne(
      { ...visible(options), projectId: project._id },
      { title: 1, slug: 1 },
    ).lean(),
  ]);

  const index = ordered.findIndex((p) => String(p._id) === String(project._id));
  const neighbour = (i: number) =>
    i >= 0 && i < ordered.length ? { title: ordered[i]!.title, slug: ordered[i]!.slug } : null;

  // Demo credentials are only meant for personal projects (portfolio.md §3.6).
  const { demoCredentials, ...rest } = project;
  return {
    ...rest,
    demoCredentials: project.type === "personal" ? (demoCredentials ?? null) : null,
    experience,
    caseStudy: caseStudy ? { title: caseStudy.title, slug: caseStudy.slug } : null,
    related,
    previous: neighbour(index - 1),
    next: neighbour(index + 1),
  };
}

async function projectLinks(ids: unknown[]) {
  const unique = [...new Set(ids.filter(Boolean).map(String))].map((id) => new Types.ObjectId(id));
  if (!unique.length) return new Map<string, { title: string; slug: string }>();
  const projects = await Project.find(
    { ...PUBLISHED, _id: mongoose.trusted({ $in: unique }) },
    { title: 1, slug: 1 },
  ).lean();
  return new Map(projects.map((p) => [String(p._id), { title: p.title, slug: p.slug }]));
}

export async function getCaseStudies() {
  const studies = await CaseStudy.find(PUBLISHED, CASE_STUDY_CARD)
    .sort({ featured: -1, order: 1 })
    .lean();
  const projects = await projectLinks(studies.map((s) => s.projectId));
  return studies.map(({ projectId, ...study }) => ({
    ...study,
    project: projectId ? (projects.get(String(projectId)) ?? null) : null,
  }));
}

export async function getCaseStudy(slug: string, options: ReadOptions = {}) {
  const study = await CaseStudy.findOne({ ...visible(options), slug }, INTERNAL).lean();
  if (!study) throw notFound("Case study not found");
  const [project, more] = await Promise.all([
    study.projectId
      ? Project.findOne({ ...visible(options), _id: study.projectId }, PROJECT_CARD).lean()
      : null,
    CaseStudy.find({ ...PUBLISHED, _id: mongoose.trusted({ $ne: study._id }) }, CASE_STUDY_CARD)
      .sort({ featured: -1, order: 1 })
      .limit(2)
      .lean(),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip the raw id; `project` replaces it
  const { projectId: _projectId, ...rest } = study;
  return { ...rest, project, more };
}

export async function getEngineering() {
  const items = await EngineeringItem.find(PUBLISHED, INTERNAL)
    .sort({ order: 1, createdAt: 1 })
    .lean();
  const projects = await projectLinks(items.map((i) => i.projectId));
  return items.map(({ projectId, ...item }) => ({
    ...item,
    project: projectId ? (projects.get(String(projectId)) ?? null) : null,
  }));
}

export async function getBuiltFeatures() {
  const features = await BuiltFeature.find(PUBLISHED, INTERNAL)
    .sort({ order: 1, feature: 1 })
    .lean();
  const ids = features.map((f) => f.projectId);
  const [projects, studies] = await Promise.all([
    projectLinks(ids),
    CaseStudy.find(
      {
        ...PUBLISHED,
        projectId: mongoose.trusted({ $in: ids.filter((id): id is Types.ObjectId => Boolean(id)) }),
      },
      { slug: 1, projectId: 1 },
    ).lean(),
  ]);
  const studyByProject = new Map(studies.map((s) => [String(s.projectId), s.slug]));
  return features.map(({ projectId, ...feature }) => ({
    ...feature,
    project: projectId ? (projects.get(String(projectId)) ?? null) : null,
    caseStudySlug: projectId ? (studyByProject.get(String(projectId)) ?? null) : null,
  }));
}

export async function getTestimonials() {
  return Testimonial.find(PUBLISHED, TESTIMONIAL_FIELDS).sort({ order: 1 }).lean();
}

export async function getAchievements() {
  const items = await Achievement.find(PUBLISHED, INTERNAL).sort({ order: 1, date: -1 }).lean();
  const projects = await projectLinks(items.map((i) => i.projectId));
  return items.map(({ projectId, ...item }) => ({
    ...item,
    project: projectId ? (projects.get(String(projectId)) ?? null) : null,
  }));
}

export async function getCertifications() {
  return Certification.find(PUBLISHED, INTERNAL).sort({ order: 1, date: -1 }).lean();
}

export async function getSkills() {
  const [skills, capabilities, projects] = await Promise.all([
    Skill.find(PUBLISHED, INTERNAL).sort({ order: 1, name: 1 }).lean(),
    Capability.find(PUBLISHED, INTERNAL).sort({ order: 1 }).lean(),
    Project.find(PUBLISHED, { title: 1, slug: 1, technologies: 1 }).sort({ order: 1 }).lean(),
  ]);
  return {
    skills: skills.map(({ projectIds, ...skill }) => {
      const linked = new Set((projectIds ?? []).map(String));
      return {
        ...skill,
        projects: projects
          .filter((p) => linked.has(String(p._id)) || (p.technologies ?? []).includes(skill.slug))
          .map((p) => ({ title: p.title, slug: p.slug })),
      };
    }),
    capabilities,
  };
}

/** Published resume: the requested variant, else the default, else the most recent. */
export async function getResume(variant?: string) {
  const fields = { label: 1, slug: 1, file: 1, isDefault: 1, updatedAt: 1 };
  const resume =
    (variant ? await Resume.findOne({ ...PUBLISHED, slug: variant }, fields).lean() : null) ??
    (await Resume.findOne({ ...PUBLISHED, isDefault: true }, fields).lean()) ??
    (await Resume.findOne(PUBLISHED, fields).sort({ updatedAt: -1 }).lean());
  if (!resume) return null;
  return { ...resume, downloadUrl: attachmentUrl(resume.file.url, resume.label) };
}

/** Cloudinary delivery URL that forces a download with a friendly filename. */
function attachmentUrl(url: string, label: string) {
  const name = `${label}-resume`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return url.includes("/upload/") ? url.replace("/upload/", `/upload/fl_attachment:${name}/`) : url;
}

export async function countResumeDownload(id: string) {
  if (!Types.ObjectId.isValid(id)) return;
  await Resume.updateOne(
    { ...PUBLISHED, _id: new Types.ObjectId(id) },
    { $inc: { downloadCount: 1 } },
  );
}

export async function getSitemapData() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- works with any content model
  const latest = async (model: mongoose.Model<any>, filter: object = PUBLISHED) =>
    (
      await model
        .findOne(filter, { updatedAt: 1 })
        .sort({ updatedAt: -1 })
        .lean<{ updatedAt?: Date }>()
    )?.updatedAt ?? null;
  const [projects, settings, about, experiences, skills, caseStudies, engineering, built] =
    await Promise.all([
      Project.find(
        { ...PUBLISHED, "seo.noindex": mongoose.trusted({ $ne: true }) },
        { slug: 1, updatedAt: 1 },
      ).lean<{ slug: string; updatedAt: Date }[]>(),
      latest(SiteSettings, {}),
      latest(About, {}),
      latest(Experience),
      latest(Skill),
      CaseStudy.find(
        { ...PUBLISHED, "seo.noindex": mongoose.trusted({ $ne: true }) },
        { slug: 1, updatedAt: 1 },
      ).lean<{ slug: string; updatedAt: Date }[]>(),
      latest(EngineeringItem),
      latest(BuiltFeature),
    ]);
  return {
    projects: projects.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt })),
    caseStudies: caseStudies.map((c) => ({ slug: c.slug, updatedAt: c.updatedAt })),
    updatedAt: { settings, about, experiences, skills, engineering, built },
  };
}
