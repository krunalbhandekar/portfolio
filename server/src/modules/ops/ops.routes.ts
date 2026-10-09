import express, { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { validate } from "../../middlewares/validate.js";
import { revalidate } from "../../services/revalidate.js";
import { conflict, notFound } from "../../utils/app-error.js";
import { paginationMeta, paginationQuerySchema, toSkip } from "../../utils/pagination.js";
import { sendSuccess } from "../../utils/response.js";
import { Admin } from "../admins/admin.model.js";
import { AuditLog } from "../audit/audit-log.model.js";
import { recordAudit } from "../audit/audit.service.js";
import {
  backupDownloadUrl,
  exportAll,
  importAll,
  listBackups,
  runBackup,
} from "../backup/backup.service.js";
import { Redirect } from "../redirects/redirect.model.js";
import { redirectInput } from "../redirects/redirect.schema.js";
import { redirectFilter } from "../redirects/redirect.service.js";
import {
  getRevision,
  listDeleted,
  listRevisions,
  restoreRevision,
} from "../revisions/revision.service.js";
import { objectId } from "../shared/fields.js";

const idParams = z.object({ id: objectId });

const auditQuery = paginationQuerySchema.extend({
  entity: z.string().trim().max(60).optional(),
  action: z.string().trim().max(80).optional(),
  outcome: z.enum(["success", "failure"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const importQuery = z.object({
  dryRun: z.enum(["true", "false"]).default("true"),
  mode: z.enum(["replace", "merge"]).default("replace"),
});

/** Admin operations (portfolio.md §15 Phase 7): history, audit, redirects, backups. */
export const opsRoutes = Router()
  // ---------------------------------------------------------------- Revisions
  .get(
    "/revisions",
    validate({
      query: z.object({ resource: z.string().min(1).max(60), documentId: objectId }),
    }),
    async (req, res) => {
      const { resource, documentId } = req.validatedQuery as {
        resource: string;
        documentId: string;
      };
      sendSuccess(res, await listRevisions(resource, documentId));
    },
  )
  .get(
    "/revisions/deleted",
    validate({ query: z.object({ resource: z.string().min(1).max(60) }) }),
    async (req, res) => {
      sendSuccess(res, await listDeleted((req.validatedQuery as { resource: string }).resource));
    },
  )
  .get("/revisions/:id", validate({ params: idParams }), async (req, res) => {
    sendSuccess(res, await getRevision(req.params.id as string));
  })
  .post("/revisions/:id/restore", validate({ params: idParams }), async (req, res) => {
    sendSuccess(res, await restoreRevision(req, req.params.id as string));
  })

  // ---------------------------------------------------------------- Audit log
  .get("/audit", validate({ query: auditQuery }), async (req, res) => {
    const q = req.validatedQuery as z.infer<typeof auditQuery>;
    const filter: Record<string, unknown> = {};
    if (q.entity) filter.entity = q.entity;
    if (q.outcome) filter.outcome = q.outcome;
    if (q.action) filter.action = new RegExp(q.action.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (q.from || q.to) {
      filter.createdAt = mongoose.trusted({
        ...(q.from ? { $gte: q.from } : {}),
        ...(q.to ? { $lte: q.to } : {}),
      });
    }
    const [items, total, admins] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(toSkip(q)).limit(q.limit).lean(),
      AuditLog.countDocuments(filter),
      Admin.find({}, { email: 1 }).lean(),
    ]);
    const emails = new Map(admins.map((a) => [String(a._id), a.email]));
    sendSuccess(
      res,
      items.map((i) => ({
        ...i,
        adminEmail: i.adminId ? (emails.get(String(i.adminId)) ?? null) : null,
      })),
      { meta: paginationMeta(total, q) },
    );
  })
  .get("/audit/entities", async (_req, res) => {
    sendSuccess(res, (await AuditLog.distinct("entity")).filter(Boolean).sort());
  })

  // ---------------------------------------------------------------- Redirects
  .get(
    "/redirects",
    validate({ query: paginationQuerySchema.extend({ q: z.string().trim().max(100).optional() }) }),
    async (req, res) => {
      const q = req.validatedQuery as z.infer<typeof paginationQuerySchema> & { q?: string };
      const filter = redirectFilter(q.q);
      const [items, total] = await Promise.all([
        Redirect.find(filter).sort({ updatedAt: -1 }).skip(toSkip(q)).limit(q.limit).lean(),
        Redirect.countDocuments(filter),
      ]);
      sendSuccess(res, items, { meta: paginationMeta(total, q) });
    },
  )
  .post("/redirects", validate({ body: redirectInput }), async (req, res) => {
    if (await Redirect.exists({ from: req.body.from })) {
      throw conflict(`A redirect from ${req.body.from} already exists`);
    }
    const doc = await Redirect.create({ ...req.body, auto: false });
    await recordAudit(req, {
      action: "redirects.create",
      adminId: req.admin!.id,
      entity: "redirects",
      entityId: doc._id,
      meta: { label: `${doc.from} → ${doc.to}` },
    });
    void revalidate({ tags: ["redirects"] });
    sendSuccess(res, doc.toObject(), { status: 201 });
  })
  .put("/redirects/:id", validate({ params: idParams, body: redirectInput }), async (req, res) => {
    if (
      await Redirect.exists({ from: req.body.from, _id: mongoose.trusted({ $ne: req.params.id }) })
    ) {
      throw conflict(`A redirect from ${req.body.from} already exists`);
    }
    const doc = await Redirect.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!doc) throw notFound("Redirect not found");
    await recordAudit(req, {
      action: "redirects.update",
      adminId: req.admin!.id,
      entity: "redirects",
      entityId: doc._id,
      meta: { label: `${doc.from} → ${doc.to}` },
    });
    void revalidate({ tags: ["redirects"] });
    sendSuccess(res, doc.toObject());
  })
  .delete("/redirects/:id", validate({ params: idParams }), async (req, res) => {
    const doc = await Redirect.findByIdAndDelete(req.params.id);
    if (!doc) throw notFound("Redirect not found");
    await recordAudit(req, {
      action: "redirects.delete",
      adminId: req.admin!.id,
      entity: "redirects",
      entityId: doc._id,
      meta: { label: `${doc.from} → ${doc.to}` },
    });
    void revalidate({ tags: ["redirects"] });
    sendSuccess(res, { deleted: true });
  })

  // ---------------------------------------------------------------- Backups, export, import
  .get("/backups", async (_req, res) => sendSuccess(res, await listBackups()))
  .post("/backups", async (req, res) => {
    const result = await runBackup("manual");
    await recordAudit(req, {
      action: "backup.create",
      adminId: req.admin!.id,
      entity: "backup",
      meta: { label: result.publicId, bytes: result.bytes },
    });
    sendSuccess(res, result, { status: 201 });
  })
  .get(
    "/backups/download",
    validate({ query: z.object({ publicId: z.string().min(1).max(200) }) }),
    async (req, res) => {
      const { publicId } = req.validatedQuery as { publicId: string };
      await recordAudit(req, {
        action: "backup.download",
        adminId: req.admin!.id,
        entity: "backup",
        meta: { label: publicId },
      });
      sendSuccess(res, { url: backupDownloadUrl(publicId) });
    },
  )
  .get("/export", async (req, res) => {
    const json = await exportAll();
    await recordAudit(req, { action: "backup.export", adminId: req.admin!.id, entity: "backup" });
    const date = new Date().toISOString().slice(0, 10);
    res
      .set("Content-Type", "application/json; charset=utf-8")
      .set("Content-Disposition", `attachment; filename="portfolio-export-${date}.json"`)
      .send(json);
  })
  // Body is the raw export file (text/plain, up to 25 MB), so it skips the 1 MB JSON parser.
  .post(
    "/import",
    express.text({ type: ["text/plain", "application/octet-stream"], limit: "25mb" }),
    validate({ query: importQuery }),
    async (req, res) => {
      const q = req.validatedQuery as z.infer<typeof importQuery>;
      const dryRun = q.dryRun === "true";
      const report = await importAll(typeof req.body === "string" ? req.body : "", {
        dryRun,
        mode: q.mode,
      });
      if (!dryRun) {
        await recordAudit(req, {
          action: "backup.import",
          adminId: req.admin!.id,
          entity: "backup",
          meta: {
            mode: q.mode,
            collections: report.collections.map((c) => `${c.name}:${c.incoming}`).join(", "),
          },
        });
      }
      sendSuccess(res, report);
    },
  );
