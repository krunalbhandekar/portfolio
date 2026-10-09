import { Router, type Request } from "express";
import mongoose, { type Model } from "mongoose";
import { z, type ZodType } from "zod";
import { validate } from "../../middlewares/validate.js";
import { recordAudit } from "../../modules/audit/audit.service.js";
import {
  clearMediaUsage,
  collectMediaIds,
  resolveMediaRefs,
  syncMediaUsage,
} from "../../modules/media/media-usage.js";
import { addAutoRedirect, clearRedirectFrom } from "../../modules/redirects/redirect.service.js";
import { snapshotRevision } from "../../modules/revisions/revision.service.js";
import { idList, objectId } from "../../modules/shared/fields.js";
import { revalidate } from "../../services/revalidate.js";
import { badRequest, notFound } from "../../utils/app-error.js";
import { paginationMeta, paginationQuerySchema, toSkip } from "../../utils/pagination.js";
import { escapeRegex } from "../../utils/regex.js";
import { sendSuccess } from "../../utils/response.js";
import { slugify, uniqueSlug } from "../../utils/slug.js";
import { registerResource } from "./registry.js";

type Doc = Record<string, unknown> & { _id: mongoose.Types.ObjectId };

export type CrudConfig = {
  /** URL segment + audit/media-usage key, e.g. "projects". */
  resource: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- factory accepts any content model
  model: Model<any>;
  /** Full-document input schema (forms send every field). */
  input: ZodType;
  /** Field used as the human label (lists, option pickers, "used in"). */
  labelField: string;
  /** Fields searched by `?q=`. */
  searchFields: string[];
  /** Generate/keep a unique `slug` from this field when the input slug is empty. */
  slugFrom?: string;
  /** Next.js cache tags to revalidate after a write (portfolio.md §10). */
  tags: (doc: Doc, previous?: Doc | null) => string[];
  /** Sortable fields for `?sort=` (prefix with "-" for descending). */
  sortable?: string[];
  /** Derives fields before saving, e.g. a case study's reading time. */
  transform?: (data: Record<string, unknown>) => Record<string, unknown>;
  /** Runs after create/update, e.g. to keep a single default resume. */
  afterSave?: (doc: Doc) => Promise<void>;
  /** Public URL for a slug; slug changes then leave a 301 from the old URL (portfolio.md §4 #14). */
  publicPath?: (slug: string) => string;
};

const idParams = z.object({ id: objectId });
const reorderSchema = z.object({ ids: idList(500).refine((ids) => ids.length > 0, "No ids") });
const scheduleSchema = z.object({ publishAt: z.coerce.date() });

export function crudRouter(config: CrudConfig) {
  const { resource, model, labelField } = config;
  const sortable = new Set([
    "order",
    "createdAt",
    "updatedAt",
    labelField,
    ...(config.sortable ?? []),
  ]);
  const listQuery = paginationQuerySchema.extend({
    q: z.string().trim().max(100).optional(),
    status: z.enum(["draft", "published", "scheduled"]).optional(),
    sort: z.string().max(40).optional(),
  });

  const labelOf = (doc: Doc) => String(doc[labelField] ?? "");

  registerResource({
    resource,
    kind: "collection",
    model,
    label: labelOf,
    tags: config.tags,
    publicPath: config.publicPath,
    afterSave: config.afterSave,
  });

  /** Snapshot before a change, so it can be reverted (revisions). */
  const snapshot = (req: Request, doc: Doc, action: string) =>
    snapshotRevision({ resource, doc, action, label: labelOf(doc), adminId: req.admin!.id });

  /** Slug changes on a public page leave a 301 behind. */
  async function syncRedirects(doc: Doc, previous?: Doc | null) {
    if (!config.publicPath || !doc.slug) return;
    const now = config.publicPath(String(doc.slug));
    await clearRedirectFrom(now);
    if (previous?.slug && previous.slug !== doc.slug && previous.status === "published") {
      await addAutoRedirect(config.publicPath(String(previous.slug)), now);
    }
  }

  async function prepare(req: Request, input: Record<string, unknown>, id?: string) {
    const data = await resolveMediaRefs({ ...input });
    if (config.slugFrom) {
      const base = slugify(String(data.slug || data[config.slugFrom] || ""));
      data.slug = await uniqueSlug(model, base, id);
    }
    data.updatedBy = req.admin!.id;
    return config.transform ? config.transform(data) : data;
  }

  async function afterWrite(req: Request, action: string, doc: Doc, previous?: Doc | null) {
    if (action === "delete") await clearMediaUsage(resource, doc._id);
    else
      await syncMediaUsage(
        { resource, documentId: doc._id, label: labelOf(doc) },
        collectMediaIds(doc),
      );
    if (config.afterSave && action !== "delete") await config.afterSave(doc);
    if (action !== "delete") await syncRedirects(doc, previous);
    await recordAudit(req, {
      action: `${resource}.${action}`,
      adminId: req.admin!.id,
      entity: resource,
      entityId: doc._id,
      meta: { label: labelOf(doc) },
    });
    // Fire-and-forget: the write succeeded; a slow/unavailable site must not block the admin.
    void revalidate({ tags: config.tags(doc, previous) });
  }

  async function findOr404(id: string) {
    const doc = await model.findById(id);
    if (!doc) throw notFound(`${resource} item not found`);
    return doc;
  }

  return (
    Router()
      .get("/", validate({ query: listQuery }), async (req, res) => {
        const query = req.validatedQuery as z.infer<typeof listQuery>;
        const filter: Record<string, unknown> = {};
        if (query.status) filter.status = query.status;
        if (query.q) {
          const pattern = new RegExp(escapeRegex(query.q), "i");
          filter.$or = mongoose.trusted(config.searchFields.map((field) => ({ [field]: pattern })));
        }
        let sort: Record<string, 1 | -1> = { order: 1, createdAt: -1 };
        if (query.sort) {
          const field = query.sort.replace(/^-/, "");
          if (sortable.has(field)) sort = { [field]: query.sort.startsWith("-") ? -1 : 1 };
        }
        const [items, total] = await Promise.all([
          model.find(filter).sort(sort).skip(toSkip(query)).limit(query.limit).lean(),
          model.countDocuments(filter),
        ]);
        sendSuccess(res, items, { meta: paginationMeta(total, query) });
      })
      .get("/options", async (_req, res) => {
        const items = await model
          .find({}, { [labelField]: 1, slug: 1, status: 1 })
          .sort({ order: 1, [labelField]: 1 })
          .limit(500)
          .lean<Doc[]>();
        sendSuccess(
          res,
          items.map((item) => ({
            id: String(item._id),
            label: labelOf(item),
            slug: item.slug ?? null,
            status: item.status ?? null,
          })),
        );
      })
      .patch("/reorder", validate({ body: reorderSchema }), async (req, res) => {
        const ids: string[] = req.body.ids;
        await model.bulkWrite(
          ids.map((id, index) => ({
            updateOne: {
              filter: { _id: new mongoose.Types.ObjectId(id) },
              update: { $set: { order: index } },
            },
          })),
        );
        await recordAudit(req, {
          action: `${resource}.reorder`,
          adminId: req.admin!.id,
          entity: resource,
        });
        void revalidate({ tags: [resource] });
        sendSuccess(res, { reordered: ids.length });
      })
      .get("/:id", validate({ params: idParams }), async (req, res) => {
        sendSuccess(res, (await findOr404(req.params.id as string)).toObject());
      })
      .post("/", validate({ body: config.input }), async (req, res) => {
        const data = await prepare(req, req.body);
        // New items go to the end of the list.
        const last = await model
          .findOne({}, { order: 1 })
          .sort({ order: -1 })
          .lean<{ order?: number }>();
        const doc = await model.create({ ...data, order: (last?.order ?? -1) + 1 });
        await afterWrite(req, "create", doc.toObject());
        sendSuccess(res, doc.toObject(), { status: 201 });
      })
      .put("/:id", validate({ params: idParams, body: config.input }), async (req, res) => {
        const id = req.params.id as string;
        const doc = await findOr404(id);
        const previous = doc.toObject() as Doc;
        await snapshot(req, previous, "update");
        doc.set(await prepare(req, req.body, id));
        await doc.save();
        await afterWrite(req, "update", doc.toObject(), previous);
        sendSuccess(res, doc.toObject());
      })
      .delete("/:id", validate({ params: idParams }), async (req, res) => {
        const doc = await findOr404(req.params.id as string);
        await snapshot(req, doc.toObject() as Doc, "delete");
        await doc.deleteOne();
        await afterWrite(req, "delete", doc.toObject());
        sendSuccess(res, { deleted: true });
      })
      .post("/:id/publish", validate({ params: idParams }), async (req, res) => {
        const doc = await findOr404(req.params.id as string);
        const previous = doc.toObject() as Doc;
        await snapshot(req, previous, "publish");
        doc.set({ status: "published", updatedBy: req.admin!.id });
        await doc.save();
        await afterWrite(req, "publish", doc.toObject(), previous);
        sendSuccess(res, doc.toObject());
      })
      .post("/:id/unpublish", validate({ params: idParams }), async (req, res) => {
        const doc = await findOr404(req.params.id as string);
        const previous = doc.toObject() as Doc;
        await snapshot(req, previous, "unpublish");
        // Unpublishing also cancels a pending schedule.
        doc.set({ status: "draft", updatedBy: req.admin!.id });
        doc.set("publishAt", undefined);
        await doc.save();
        await afterWrite(req, "unpublish", doc.toObject(), previous);
        sendSuccess(res, doc.toObject());
      })
      // Scheduled publishing (portfolio.md §4 #5): POST /jobs/publish-scheduled makes it live.
      .post(
        "/:id/schedule",
        validate({ params: idParams, body: scheduleSchema }),
        async (req, res) => {
          const publishAt = req.body.publishAt as Date;
          if (publishAt.getTime() < Date.now() + 60_000) {
            throw badRequest("Pick a time at least a minute from now", [
              { path: "publishAt", message: "Must be in the future" },
            ]);
          }
          const doc = await findOr404(req.params.id as string);
          const previous = doc.toObject() as Doc;
          await snapshot(req, previous, "schedule");
          doc.set({ status: "scheduled", publishAt, updatedBy: req.admin!.id });
          await doc.save();
          await afterWrite(req, "schedule", doc.toObject(), previous);
          sendSuccess(res, doc.toObject());
        },
      )
  );
}
