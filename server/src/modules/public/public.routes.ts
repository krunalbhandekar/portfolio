import { Router } from "express";
import { z } from "zod";
import {
  contactLimiter,
  eventsLimiter,
  searchLimiter,
  testimonialLimiter,
} from "../../middlewares/rate-limit.js";
import { validate } from "../../middlewares/validate.js";
import { sendSuccess } from "../../utils/response.js";
import { SLUG_PATTERN } from "../../utils/slug.js";
import { recordEvent, recordResumeDownload } from "../analytics/analytics.service.js";
import { eventInput } from "../analytics/event.schema.js";
import { contactSchema } from "../messages/contact.schema.js";
import { submitContact } from "../messages/contact.service.js";
import {
  visitorTestimonialSchema,
  visitorVerifySchema,
} from "../testimonials/testimonial.schema.js";
import {
  submitVisitorTestimonial,
  verifyVisitor,
} from "../testimonials/visitor-testimonial.service.js";
import { getFeedPosts, getPost, getPosts } from "../posts/post.public.js";
import { getSearchIndex, search } from "../search/search.service.js";
import { getRedirectMap } from "../redirects/redirect.service.js";
import { getSkill } from "../skills/skill.public.js";
import * as service from "./public.service.js";
import { requirePreviewSecret } from "../../middlewares/preview-secret.js";

const projectsQuery = z.object({
  category: z.string().max(40).optional(),
  tech: z.string().regex(SLUG_PATTERN).optional(),
  type: z.enum(["professional", "personal"]).optional(),
  q: z.string().trim().max(100).optional(),
});
const slugParams = z.object({ slug: z.string().regex(SLUG_PATTERN) });
const resumeQuery = z.object({ v: z.string().regex(SLUG_PATTERN).optional() });
const postsQuery = z.object({
  tag: z.string().trim().toLowerCase().max(30).optional(),
  category: z.string().trim().max(40).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const searchQuery = z.object({ q: z.string().trim().max(100).default("") });

/** Public, read-only API used by the Next.js site (portfolio.md §10). */
export const publicRoutes = Router()
  .get("/settings", async (_req, res) => sendSuccess(res, await service.getSettings()))
  .get("/home", async (_req, res) => sendSuccess(res, await service.getHome()))
  .get("/about", async (_req, res) => sendSuccess(res, await service.getAbout()))
  .get("/experiences", async (_req, res) => sendSuccess(res, await service.getExperiences()))
  .get("/projects", validate({ query: projectsQuery }), async (req, res) => {
    sendSuccess(
      res,
      await service.getProjects(req.validatedQuery as z.infer<typeof projectsQuery>),
    );
  })
  .get("/projects/:slug", validate({ params: slugParams }), async (req, res) =>
    sendSuccess(res, await service.getProject(req.params.slug as string)),
  )
  .get("/skills", async (_req, res) => sendSuccess(res, await service.getSkills()))
  .get("/case-studies", async (_req, res) => sendSuccess(res, await service.getCaseStudies()))
  .get("/case-studies/:slug", validate({ params: slugParams }), async (req, res) =>
    sendSuccess(res, await service.getCaseStudy(req.params.slug as string)),
  )
  .get("/engineering", async (_req, res) => sendSuccess(res, await service.getEngineering()))
  .get("/built-features", async (_req, res) => sendSuccess(res, await service.getBuiltFeatures()))
  .get("/testimonials", async (_req, res) => sendSuccess(res, await service.getTestimonials()))
  .get("/achievements", async (_req, res) => sendSuccess(res, await service.getAchievements()))
  .get("/certifications", async (_req, res) => sendSuccess(res, await service.getCertifications()))
  // Draft previews (Next.js Draft Mode, portfolio.md §5.3): server-to-server only.
  .get(
    "/preview/projects/:slug",
    requirePreviewSecret,
    validate({ params: slugParams }),
    async (req, res) =>
      sendSuccess(res, await service.getProject(req.params.slug as string, { drafts: true })),
  )
  .get(
    "/preview/case-studies/:slug",
    requirePreviewSecret,
    validate({ params: slugParams }),
    async (req, res) =>
      sendSuccess(res, await service.getCaseStudy(req.params.slug as string, { drafts: true })),
  )
  .get("/resume", validate({ query: resumeQuery }), async (req, res) =>
    sendSuccess(
      res,
      await service.getResume((req.validatedQuery as z.infer<typeof resumeQuery>).v),
    ),
  )
  // Redirect-style download (counts, then sends the browser to Cloudinary).
  .get("/resume/download", validate({ query: resumeQuery }), async (req, res) => {
    const resume = await service.getResume((req.validatedQuery as z.infer<typeof resumeQuery>).v);
    if (!resume)
      return void res.status(404).json({
        success: false,
        data: null,
        error: { code: "NOT_FOUND", message: "No resume published" },
      });
    await service.countResumeDownload(String(resume._id));
    res.redirect(302, resume.downloadUrl);
  })
  // Beacon from the site's download button, which links to Cloudinary directly (instant even
  // while this server is asleep).
  .post("/resume/:id/downloaded", async (req, res) => {
    const id = String(req.params.id);
    if (await service.countResumeDownload(id)) await recordResumeDownload(req, id);
    res.status(204).end();
  })
  .get("/resumes", async (_req, res) => sendSuccess(res, await service.getResumes()))
  // Phase 6
  .get("/posts", validate({ query: postsQuery }), async (req, res) =>
    sendSuccess(res, await getPosts(req.validatedQuery as z.infer<typeof postsQuery>)),
  )
  .get("/posts/:slug", validate({ params: slugParams }), async (req, res) =>
    sendSuccess(res, await getPost(req.params.slug as string)),
  )
  .get(
    "/preview/posts/:slug",
    requirePreviewSecret,
    validate({ params: slugParams }),
    async (req, res) =>
      sendSuccess(res, await getPost(req.params.slug as string, { drafts: true })),
  )
  .get("/feed", async (_req, res) => sendSuccess(res, await getFeedPosts()))
  .get("/skills/:slug", validate({ params: slugParams }), async (req, res) =>
    sendSuccess(res, await getSkill(req.params.slug as string)),
  )
  .get("/search-index", async (_req, res) => sendSuccess(res, await getSearchIndex()))
  .get("/search", searchLimiter, validate({ query: searchQuery }), async (req, res) =>
    sendSuccess(res, await search((req.validatedQuery as z.infer<typeof searchQuery>).q)),
  )
  .post("/events", eventsLimiter, validate({ body: eventInput }), async (req, res) => {
    await recordEvent(req, req.body);
    res.status(204).end();
  })
  // Phase 7
  .get("/pages", async (_req, res) => sendSuccess(res, await service.getVisiblePages()))
  .get("/pages/:key", async (req, res) =>
    sendSuccess(res, await service.getPage(String(req.params.key))),
  )
  .get("/redirects", async (_req, res) => sendSuccess(res, await getRedirectMap()))
  .get("/sitemap-data", async (_req, res) => sendSuccess(res, await service.getSitemapData()))
  .post("/contact", contactLimiter, validate({ body: contactSchema }), async (req, res) =>
    sendSuccess(res, await submitContact(req, req.body), { status: 201 }),
  )
  // Visitor testimonials: Google-verified, stored as drafts for the owner to review.
  .post(
    "/testimonials/verify",
    testimonialLimiter,
    validate({ body: visitorVerifySchema }),
    async (req, res) => sendSuccess(res, await verifyVisitor(req.body.credential)),
  )
  .post(
    "/testimonials",
    testimonialLimiter,
    validate({ body: visitorTestimonialSchema }),
    async (req, res) =>
      sendSuccess(res, await submitVisitorTestimonial(req, req.body), { status: 201 }),
  );
