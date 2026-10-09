import mongoose from "mongoose";
import { registry, type RegistryDoc } from "../../lib/crud/registry.js";
import { logger } from "../../lib/logger.js";
import { revalidate } from "../../services/revalidate.js";
import { AuditLog } from "../audit/audit-log.model.js";
import { clearRedirectFrom } from "../redirects/redirect.service.js";
import { snapshotRevision } from "../revisions/revision.service.js";

/**
 * `POST /jobs/publish-scheduled` (every 15 min, portfolio.md §13.3): publishes every item whose
 * `publishAt` has passed, then revalidates the affected pages.
 */
export async function publishScheduled(now = new Date()) {
  const published: { resource: string; id: string; label: string }[] = [];
  const tags = new Set<string>();

  for (const entry of registry.values()) {
    if (entry.kind !== "collection") continue;
    const due = await entry.model.find({
      status: "scheduled",
      publishAt: mongoose.trusted({ $lte: now }),
    });
    for (const doc of due) {
      const previous = doc.toObject() as RegistryDoc;
      await snapshotRevision({
        resource: entry.resource,
        doc: previous,
        action: "publish",
        label: entry.label(previous),
      });
      doc.set({ status: "published" });
      await doc.save();
      const saved = doc.toObject() as RegistryDoc;
      if (entry.afterSave) await entry.afterSave(saved);
      if (entry.publicPath && saved.slug)
        await clearRedirectFrom(entry.publicPath(String(saved.slug)));
      entry.tags(saved, previous).forEach((t) => tags.add(t));
      published.push({
        resource: entry.resource,
        id: String(saved._id),
        label: entry.label(saved),
      });
      await AuditLog.create({
        action: `${entry.resource}.publish`,
        entity: entry.resource,
        entityId: saved._id,
        meta: { label: entry.label(saved), scheduled: true, publishAt: previous.publishAt },
      });
    }
  }
  if (tags.size) void revalidate({ tags: [...tags] });
  if (published.length) logger.info({ published }, "Scheduled content published");
  return { published };
}
