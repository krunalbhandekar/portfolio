import type { Request } from "express";
import mongoose from "mongoose";
import type { z } from "zod";
import { env } from "../../config/env.js";
import { CaseStudy } from "../case-studies/case-study.model.js";
import { Message } from "../messages/message.model.js";
import { Post } from "../posts/post.model.js";
import { Project } from "../projects/project.model.js";
import { Resume } from "../resumes/resume.model.js";
import { Event } from "./event.model.js";
import type { eventInput } from "./event.schema.js";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless|curl|wget/i;

/** Own site, so internal navigation isn't counted as a referrer. */
const ownHosts = new Set([new URL(env.CLIENT_URL).hostname]);

function referrerHost(referrer: string) {
  if (!referrer) return "";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (ownHosts.has(host) || ownHosts.has(`www.${host}`)) return "";
    // Collapse LinkedIn's mobile/app hosts etc. into their main site.
    if (host.endsWith("linkedin.com") || host === "lnkd.in") return "linkedin.com";
    if (host.endsWith("google.com") || /^google\./.test(host)) return "google";
    return host;
  } catch {
    return "";
  }
}

export async function recordEvent(req: Request, input: z.infer<typeof eventInput>) {
  if (BOT.test(req.get("user-agent") ?? "")) return;
  await Event.create({
    type: input.type,
    path: input.path,
    refId: input.refId || undefined,
    referrer: referrerHost(input.referrer) || undefined,
  });
}

/** Resume downloads are also events, so the dashboard can show them per period. */
export async function recordResumeDownload(req: Request, resumeId: string) {
  if (BOT.test(req.get("user-agent") ?? "")) return;
  await Event.create({ type: "resume_download", refId: resumeId, path: "/resume" });
}

const top = (match: object, field: string, limit = 8) =>
  Event.aggregate<{ _id: string; count: number }>([
    { $match: match },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $match: { _id: { $nin: [null, ""] } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);

/** Admin dashboard v2 (portfolio.md §4 #10–11). */
export async function getAnalytics(days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  since.setUTCHours(0, 0, 0, 0);
  const inRange = { createdAt: mongoose.trusted({ $gte: since }) };
  const views = { ...inRange, type: "page_view" as const };

  const [
    daily,
    totalViews,
    topPages,
    referrers,
    projectViews,
    caseStudyViews,
    postViews,
    downloads,
    resumes,
    messages,
  ] = await Promise.all([
    Event.aggregate<{ _id: string; count: number }>([
      { $match: views },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Event.countDocuments(views),
    top(views, "path"),
    top(views, "referrer"),
    top({ ...inRange, type: "project_view" }, "refId", 5),
    top({ ...inRange, type: "case_study_view" }, "refId", 5),
    top({ ...inRange, type: "post_view" }, "refId", 5),
    top({ ...inRange, type: "resume_download" }, "refId", 10),
    Resume.find({}, { label: 1, slug: 1, downloadCount: 1, isDefault: 1, status: 1 })
      .sort({ isDefault: -1, order: 1 })
      .lean(),
    Message.countDocuments(inRange),
  ]);

  // Fill missing days with zero so the chart has one bar per day.
  const byDay = new Map(daily.map((d) => [d._id, d.count]));
  const series: { date: string; views: number }[] = [];
  for (let d = new Date(since); d <= new Date(); d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, views: byDay.get(key) ?? 0 });
  }

  const titles = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- works with any content model
    model: mongoose.Model<any>,
    rows: { _id: string; count: number }[],
  ) => {
    const docs = await model
      .find({ slug: mongoose.trusted({ $in: rows.map((r) => r._id) }) }, { title: 1, slug: 1 })
      .lean<{ title: string; slug: string }[]>();
    const bySlug = new Map(docs.map((d) => [d.slug, d.title]));
    return rows.map((r) => ({ slug: r._id, title: bySlug.get(r._id) ?? r._id, views: r.count }));
  };
  const downloadsById = new Map(downloads.map((d) => [d._id, d.count]));

  return {
    days,
    since,
    totals: {
      views: totalViews,
      downloads: downloads.reduce((sum, d) => sum + d.count, 0),
      messages,
    },
    series,
    topPages: topPages.map((p) => ({ path: p._id, views: p.count })),
    referrers: referrers.map((r) => ({ host: r._id, views: r.count })),
    topProjects: await titles(Project, projectViews),
    topCaseStudies: await titles(CaseStudy, caseStudyViews),
    topPosts: await titles(Post, postViews),
    resumes: resumes.map((r) => ({
      _id: String(r._id),
      label: r.label,
      slug: r.slug,
      isDefault: !!r.isDefault,
      status: String((r as { status?: string }).status ?? "draft"),
      downloads: downloadsById.get(String(r._id)) ?? 0,
      allTime: r.downloadCount ?? 0,
    })),
  };
}
