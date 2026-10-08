import { Router } from "express";
import { z } from "zod";
import { contactLimiter } from "../../middlewares/rate-limit.js";
import { validate } from "../../middlewares/validate.js";
import { sendSuccess } from "../../utils/response.js";
import { SLUG_PATTERN } from "../../utils/slug.js";
import { contactSchema } from "../messages/contact.schema.js";
import { submitContact } from "../messages/contact.service.js";
import * as service from "./public.service.js";

const projectsQuery = z.object({
  category: z.string().max(40).optional(),
  tech: z.string().regex(SLUG_PATTERN).optional(),
  type: z.enum(["professional", "personal"]).optional(),
  q: z.string().trim().max(100).optional(),
  featured: z.enum(["true", "false"]).optional(),
});
const slugParams = z.object({ slug: z.string().regex(SLUG_PATTERN) });
const resumeQuery = z.object({ v: z.string().regex(SLUG_PATTERN).optional() });

/** Public, read-only API used by the Next.js site (portfolio.md §10). */
export const publicRoutes = Router()
  .get("/settings", async (_req, res) => sendSuccess(res, await service.getSettings()))
  .get("/home", async (_req, res) => sendSuccess(res, await service.getHome()))
  .get("/about", async (_req, res) => sendSuccess(res, await service.getAbout()))
  .get("/experiences", async (_req, res) => sendSuccess(res, await service.getExperiences()))
  .get("/projects", validate({ query: projectsQuery }), async (req, res) => {
    const { featured, ...query } = req.validatedQuery as z.infer<typeof projectsQuery>;
    sendSuccess(res, await service.getProjects({ ...query, featured: featured === "true" }));
  })
  .get("/projects/:slug", validate({ params: slugParams }), async (req, res) =>
    sendSuccess(res, await service.getProject(req.params.slug as string)),
  )
  .get("/skills", async (_req, res) => sendSuccess(res, await service.getSkills()))
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
    await service.countResumeDownload(String(req.params.id));
    res.status(204).end();
  })
  .get("/sitemap-data", async (_req, res) => sendSuccess(res, await service.getSitemapData()))
  .post("/contact", contactLimiter, validate({ body: contactSchema }), async (req, res) =>
    sendSuccess(res, await submitContact(req, req.body), { status: 201 }),
  );
