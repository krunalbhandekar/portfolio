import mongoose from "mongoose";
import { notFound } from "../../utils/app-error.js";
import { BuiltFeature } from "../built-features/built-feature.model.js";
import { Experience } from "../experiences/experience.model.js";
import { Post } from "../posts/post.model.js";
import { POST_CARD } from "../posts/post.public.js";
import { Project } from "../projects/project.model.js";
import { Skill } from "./skill.model.js";

const PUBLISHED = { status: "published" } as const;

/**
 * One skill with everything that uses it (portfolio.md §4 #4): projects (linked explicitly or
 * listing it as a technology), "What I Built" features, jobs and blog posts tagged with it.
 */
export async function getSkill(slug: string) {
  const skill = await Skill.findOne(
    { ...PUBLISHED, slug },
    {
      name: 1,
      slug: 1,
      category: 1,
      icon: 1,
      levelLabel: 1,
      years: 1,
      projectIds: 1,
      updatedAt: 1,
    },
  ).lean();
  if (!skill) throw notFound("Skill not found");

  const linked = (skill.projectIds ?? []).map((id) => new mongoose.Types.ObjectId(String(id)));
  // Posts can be tagged with the slug ("node-js") or the name ("node.js").
  const postTags = [...new Set([slug, skill.name.toLowerCase()])];

  const [projects, features, experiences, posts] = await Promise.all([
    Project.find(
      {
        ...PUBLISHED,
        // sanitizeFilter: every operator, including nested ones, must be marked trusted.
        $or: mongoose.trusted([{ technologies: slug }, { _id: mongoose.trusted({ $in: linked }) }]),
      },
      {
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
      },
    )
      .sort({ featured: -1, order: 1 })
      .lean(),
    BuiltFeature.find({ ...PUBLISHED, technologies: slug }, { feature: 1, area: 1, projectId: 1 })
      .sort({ order: 1 })
      .lean(),
    Experience.find(
      { ...PUBLISHED, technologies: slug },
      { company: 1, position: 1, startDate: 1, endDate: 1, isCurrent: 1 },
    )
      .sort({ isCurrent: -1, startDate: -1 })
      .lean(),
    Post.find({ ...PUBLISHED, tags: mongoose.trusted({ $in: postTags }) }, POST_CARD)
      .sort({ publishedAt: -1 })
      .limit(6)
      .lean(),
  ]);

  const projectSlugs = new Map(projects.map((p) => [String(p._id), p.slug]));
  const { projectIds: _ids, ...rest } = skill; // eslint-disable-line @typescript-eslint/no-unused-vars -- internal ids aren't public
  return {
    ...rest,
    projects,
    features: features.map(({ projectId, ...f }) => ({
      ...f,
      projectSlug: projectId ? (projectSlugs.get(String(projectId)) ?? null) : null,
    })),
    experiences,
    posts,
  };
}
