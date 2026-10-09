import type { Request } from "express";
import mongoose, { Types } from "mongoose";
import { logger } from "../../lib/logger.js";
import { registry, type RegistryDoc } from "../../lib/crud/registry.js";
import { revalidate } from "../../services/revalidate.js";
import { AppError, badRequest, notFound } from "../../utils/app-error.js";
import { recordAudit } from "../audit/audit.service.js";
import { Media } from "../media/media.model.js";
import { collectMediaIds, syncMediaUsage } from "../media/media-usage.js";
import { addAutoRedirect, clearRedirectFrom } from "../redirects/redirect.service.js";
import { REVISIONS_PER_DOCUMENT, Revision } from "./revision.model.js";

type SnapshotInput = {
  resource: string;
  doc: RegistryDoc;
  action: string;
  label?: string;
  adminId?: Types.ObjectId;
};

/**
 * Stores the document's state *before* a change. Never throws: a failed snapshot must not
 * block the edit itself (it's logged).
 */
export async function snapshotRevision({ resource, doc, action, label, adminId }: SnapshotInput) {
  try {
    await Revision.create({ resource, documentId: doc._id, action, label, snapshot: doc, adminId });
    // Keep only the newest N per document.
    const stale = await Revision.find({ resource, documentId: doc._id }, { _id: 1 })
      .sort({ createdAt: -1 })
      .skip(REVISIONS_PER_DOCUMENT)
      .lean();
    if (stale.length) {
      await Revision.deleteMany({ _id: mongoose.trusted({ $in: stale.map((r) => r._id) }) });
    }
  } catch (err) {
    logger.error({ err, resource, action }, "Failed to store revision");
  }
}

const SUMMARY = { snapshot: 0 } as const;

export async function listRevisions(resource: string, documentId: string) {
  if (!Types.ObjectId.isValid(documentId)) throw badRequest("Invalid document id");
  return Revision.find({ resource, documentId: new Types.ObjectId(documentId) }, SUMMARY)
    .sort({ createdAt: -1 })
    .limit(REVISIONS_PER_DOCUMENT)
    .lean();
}

export async function getRevision(id: string) {
  if (!Types.ObjectId.isValid(id)) throw badRequest("Invalid revision id");
  const revision = await Revision.findById(id).lean();
  if (!revision) throw notFound("Revision not found");
  return revision;
}

/** Fields that belong to the stored document's identity/bookkeeping, not its content. */
const strip = ({ __v, createdAt, updatedAt, ...rest }: Record<string, unknown>) => {
  void __v;
  return { rest, createdAt, updatedAt };
};

/**
 * Puts a document back to a revision's snapshot. The current state is snapshotted first, so a
 * restore can itself be undone. Deleted documents are re-created with their original id.
 */
export async function restoreRevision(req: Request, id: string) {
  const revision = await getRevision(id);
  const entry = registry.get(revision.resource);
  if (!entry) throw notFound("This content type can no longer be restored");
  const snapshot = revision.snapshot as RegistryDoc;
  const adminId = req.admin!.id;

  const current = await entry.model.findById(revision.documentId);
  const previous = current ? (current.toObject() as RegistryDoc) : null;
  if (previous) {
    await snapshotRevision({
      resource: entry.resource,
      doc: previous,
      action: "restore",
      label: entry.label(previous),
      adminId,
    });
  }

  const { rest, createdAt } = strip(snapshot);
  const content = { ...rest, _id: revision.documentId, updatedBy: adminId };
  let restored;
  try {
    if (current) {
      current.overwrite({ ...content, createdAt: current.get("createdAt") ?? createdAt });
      restored = await current.save();
    } else {
      restored = await entry.model.create({ ...content, createdAt });
    }
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw new AppError(
        409,
        "RESTORE_CONFLICT",
        "Another item now uses this slug. Rename it first, then restore.",
      );
    }
    throw err;
  }
  const doc = restored.toObject() as RegistryDoc;

  // Media that has since been deleted can't be referenced again; keep the usage list honest.
  const ids = collectMediaIds(doc);
  const existing = ids.length
    ? (
        await Media.find(
          { _id: mongoose.trusted({ $in: ids.map((i) => new Types.ObjectId(i)) }) },
          { _id: 1 },
        ).lean()
      ).map((m) => String(m._id))
    : [];
  await syncMediaUsage(
    { resource: entry.resource, documentId: doc._id, label: entry.label(doc) },
    existing,
  );

  // A restore that changes the slug behaves like a rename.
  if (entry.publicPath) {
    const before = previous?.slug ? entry.publicPath(String(previous.slug)) : null;
    const after = doc.slug ? entry.publicPath(String(doc.slug)) : null;
    if (after) await clearRedirectFrom(after);
    if (before && after && before !== after && previous?.status === "published") {
      await addAutoRedirect(before, after);
    }
  }
  if (entry.afterSave) await entry.afterSave(doc);

  await recordAudit(req, {
    action: `${entry.resource}.restore`,
    adminId,
    entity: entry.resource,
    entityId: doc._id,
    meta: {
      label: entry.label(doc),
      revisionId: String(revision._id),
      from: String(revision.createdAt),
      undeleted: !current,
    },
  });
  void revalidate({ tags: entry.tags(doc, previous) });
  return { restored: true, document: doc, missingMedia: ids.length - existing.length };
}
