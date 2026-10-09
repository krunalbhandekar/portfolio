import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { sendSuccess } from "../../utils/response.js";
import { recordAudit } from "../audit/audit.service.js";
import { objectId } from "../shared/fields.js";
import {
  createMediaSchema,
  listMediaQuerySchema,
  signatureSchema,
  updateMediaSchema,
} from "./media.schema.js";
import * as service from "./media.service.js";
import { z } from "zod";

const idParams = z.object({ id: objectId });

export const mediaRoutes = Router()
  .post("/signature", validate({ body: signatureSchema }), (req, res) => {
    sendSuccess(res, service.createUploadSignature(req.body.folder));
  })
  .get("/", validate({ query: listMediaQuerySchema }), async (req, res) => {
    const { items, meta } = await service.listMedia(
      req.validatedQuery as z.infer<typeof listMediaQuerySchema>,
    );
    sendSuccess(res, items, { meta });
  })
  .get("/usage", async (_req, res) => {
    sendSuccess(res, await service.getCloudinaryUsage());
  })
  .get("/folders", async (_req, res) => {
    sendSuccess(res, await service.listFolders());
  })
  .post("/", validate({ body: createMediaSchema }), async (req, res) => {
    const media = await service.registerUpload(req.body, req.admin!.id);
    await recordAudit(req, {
      action: "media.create",
      adminId: req.admin!.id,
      entity: "media",
      entityId: media._id,
    });
    sendSuccess(res, media, { status: 201 });
  })
  .patch("/:id", validate({ params: idParams, body: updateMediaSchema }), async (req, res) => {
    const media = await service.updateAlt(req.params.id as string, req.body.alt);
    sendSuccess(res, media);
  })
  .delete("/:id", validate({ params: idParams }), async (req, res) => {
    const media = await service.deleteMedia(req.params.id as string);
    await recordAudit(req, {
      action: "media.delete",
      adminId: req.admin!.id,
      entity: "media",
      entityId: media._id,
      meta: { publicId: media.publicId },
    });
    sendSuccess(res, { deleted: true });
  });
