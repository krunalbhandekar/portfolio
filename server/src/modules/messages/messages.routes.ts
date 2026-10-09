import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { validate } from "../../middlewares/validate.js";
import { notFound } from "../../utils/app-error.js";
import { paginationMeta, paginationQuerySchema, toSkip } from "../../utils/pagination.js";
import { escapeRegex } from "../../utils/regex.js";
import { sendSuccess } from "../../utils/response.js";
import { recordAudit } from "../audit/audit.service.js";
import { objectId } from "../shared/fields.js";
import { Message } from "./message.model.js";

const listQuery = paginationQuerySchema.extend({
  box: z.enum(["inbox", "unread", "archived", "all"]).default("inbox"),
  q: z.string().trim().max(100).optional(),
});
const idParams = z.object({ id: objectId });
const updateBody = z
  .object({ read: z.boolean().optional(), archived: z.boolean().optional() })
  .refine((v) => v.read !== undefined || v.archived !== undefined, "Nothing to update");

const PUBLIC_FIELDS = { ip: 0, userAgent: 0, __v: 0 } as const;

function boxFilter(box: z.infer<typeof listQuery>["box"]) {
  if (box === "unread") return { archived: false, read: false };
  if (box === "archived") return { archived: true };
  if (box === "inbox") return { archived: false };
  return {};
}

/** Contact inbox (portfolio.md §4 #9). Mounted at /api/v1/admin/messages. */
export const messagesRoutes = Router()
  .get("/", validate({ query: listQuery }), async (req, res) => {
    const query = req.validatedQuery as z.infer<typeof listQuery>;
    const filter: Record<string, unknown> = boxFilter(query.box);
    if (query.q) {
      const pattern = new RegExp(escapeRegex(query.q), "i");
      filter.$or = mongoose.trusted([
        { name: pattern },
        { email: pattern },
        { subject: pattern },
        { message: pattern },
      ]);
    }
    const [items, total] = await Promise.all([
      Message.find(filter, PUBLIC_FIELDS)
        .sort({ createdAt: -1 })
        .skip(toSkip(query))
        .limit(query.limit)
        .lean(),
      Message.countDocuments(filter),
    ]);
    sendSuccess(res, items, { meta: paginationMeta(total, query) });
  })
  .get("/unread-count", async (_req, res) => {
    sendSuccess(res, { count: await Message.countDocuments({ read: false, archived: false }) });
  })
  .get("/export.csv", async (_req, res) => {
    const rows = await Message.find({}, PUBLIC_FIELDS).sort({ createdAt: -1 }).lean();
    const cell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const header = ["Date", "Name", "Email", "Reason", "Subject", "Message", "Read", "Archived"];
    const lines = rows.map((m) =>
      [
        m.createdAt?.toISOString(),
        m.name,
        m.email,
        m.reason,
        m.subject,
        m.message,
        m.read,
        m.archived,
      ]
        .map(cell)
        .join(","),
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="messages-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send([header.map(cell).join(","), ...lines].join("\n"));
  })
  .patch("/:id", validate({ params: idParams, body: updateBody }), async (req, res) => {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, projection: PUBLIC_FIELDS },
    );
    if (!message) throw notFound("Message not found");
    sendSuccess(res, message);
  })
  .delete("/:id", validate({ params: idParams }), async (req, res) => {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) throw notFound("Message not found");
    await recordAudit(req, {
      action: "messages.delete",
      adminId: req.admin!.id,
      entity: "messages",
      entityId: message._id,
    });
    sendSuccess(res, { deleted: true });
  });
