import { Router } from "express";
import type { Model } from "mongoose";
import type { ZodType } from "zod";
import { validate } from "../../middlewares/validate.js";
import { recordAudit } from "../../modules/audit/audit.service.js";
import {
  collectMediaIds,
  resolveMediaRefs,
  syncMediaUsage,
} from "../../modules/media/media-usage.js";
import { snapshotRevision } from "../../modules/revisions/revision.service.js";
import { revalidate } from "../../services/revalidate.js";
import { sendSuccess } from "../../utils/response.js";
import { registerResource, type RegistryDoc } from "./registry.js";

export const SINGLETON_KEY = "default";

export type SingletonConfig = {
  /** URL segment + audit/media-usage key, e.g. "settings". */
  resource: string;
  /** Label shown in the media library's "Used in" list. */
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- factory accepts any content model
  model: Model<any>;
  input: ZodType;
  /** Returned by GET before the document has ever been saved. */
  defaults: Record<string, unknown>;
  tags: string[];
  /** Document key; several singletons can share a collection (e.g. pages: now/uses/faq). */
  key?: string;
};

/** GET returns the document (or schema defaults); PUT replaces it. */
export function singletonRouter(config: SingletonConfig) {
  const { resource, model } = config;
  const key = config.key ?? SINGLETON_KEY;
  registerResource({
    resource,
    kind: "singleton",
    model,
    label: () => config.label,
    tags: () => config.tags,
    singletonKey: key,
  });

  return Router()
    .get("/", async (_req, res) => {
      const doc = await model.findOne({ key }).lean();
      sendSuccess(res, doc ?? { key, ...config.defaults });
    })
    .put("/", validate({ body: config.input }), async (req, res) => {
      const data = { ...(await resolveMediaRefs({ ...req.body })), updatedBy: req.admin!.id };
      const previous = await model.findOne({ key }).lean<RegistryDoc>();
      if (previous) {
        await snapshotRevision({
          resource,
          doc: previous,
          action: "update",
          label: config.label,
          adminId: req.admin!.id,
        });
      }
      const doc = await model.findOneAndUpdate(
        { key },
        { $set: data },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
      );
      await syncMediaUsage(
        { resource, documentId: doc._id, label: config.label },
        collectMediaIds(doc.toObject()),
      );
      await recordAudit(req, {
        action: `${resource}.update`,
        adminId: req.admin!.id,
        entity: resource,
        entityId: doc._id,
      });
      void revalidate({ tags: config.tags });
      sendSuccess(res, doc.toObject());
    });
}
