import mongoose, { type Model } from "mongoose";
import { isDatabaseUp } from "../../config/db.js";
import { Achievement } from "../achievements/achievement.model.js";
import { Admin } from "../admins/admin.model.js";
import { AuditLog } from "../audit/audit-log.model.js";
import { BuiltFeature } from "../built-features/built-feature.model.js";
import { CaseStudy } from "../case-studies/case-study.model.js";
import { Certification } from "../certifications/certification.model.js";
import { EngineeringItem } from "../engineering/engineering.model.js";
import { Experience } from "../experiences/experience.model.js";
import { Message } from "../messages/message.model.js";
import { Post } from "../posts/post.model.js";
import { Project } from "../projects/project.model.js";
import { Resume } from "../resumes/resume.model.js";
import { Skill } from "../skills/skill.model.js";
import { Testimonial } from "../testimonials/testimonial.model.js";
import type { Types } from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any content model
const COUNTED: [key: string, label: string, model: Model<any>][] = [
  ["projects", "Projects", Project],
  ["case-studies", "Case studies", CaseStudy],
  ["posts", "Blog posts", Post],
  ["engineering", "Engineering", EngineeringItem],
  ["built-features", "What I Built", BuiltFeature],
  ["experiences", "Experience", Experience],
  ["skills", "Skills", Skill],
  ["testimonials", "Testimonials", Testimonial],
  ["achievements", "Achievements", Achievement],
  ["certifications", "Certifications", Certification],
  ["resumes", "Resumes", Resume],
];

/** Dashboard v1 (portfolio.md §15, Phase 5): content counts, unread messages, recent edits. */
export async function getDashboard(adminId: Types.ObjectId) {
  const [admin, counts, unreadMessages, totalMessages, recentEdits] = await Promise.all([
    Admin.findById(adminId, { lastLoginAt: 1 }).lean(),
    Promise.all(
      COUNTED.map(async ([key, label, model]) => {
        const [total, drafts] = await Promise.all([
          model.countDocuments({}),
          model.countDocuments({ status: "draft" }),
        ]);
        return { key, label, total, drafts };
      }),
    ),
    Message.countDocuments({ read: false, archived: false }),
    Message.countDocuments({}),
    AuditLog.find(
      { action: mongoose.trusted({ $not: /^auth\./ }) },
      { action: 1, entity: 1, entityId: 1, meta: 1, createdAt: 1 },
    )
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  return {
    lastLoginAt: admin?.lastLoginAt ?? null,
    database: isDatabaseUp() ? "up" : "down",
    counts,
    drafts: counts.reduce((sum, c) => sum + c.drafts, 0),
    messages: { unread: unreadMessages, total: totalMessages },
    recentEdits: recentEdits.map((e) => ({
      action: e.action,
      entity: e.entity,
      entityId: e.entityId,
      label: (e.meta as { label?: string } | undefined)?.label ?? "",
      createdAt: e.createdAt,
    })),
  };
}
