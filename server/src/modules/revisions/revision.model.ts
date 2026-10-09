import { model, Schema } from "mongoose";

/** How many revisions are kept per document (older ones are pruned). */
export const REVISIONS_PER_DOCUMENT = 30;

/**
 * Snapshot of a document *before* a change (portfolio.md §4 #6), so any edit, publish,
 * schedule or delete can be reverted from the admin.
 */
const revisionSchema = new Schema(
  {
    resource: { type: String, required: true },
    documentId: { type: Schema.Types.ObjectId, required: true },
    /** The change that followed this snapshot: update, delete, publish, restore… */
    action: { type: String, required: true },
    label: String,
    snapshot: { type: Schema.Types.Mixed, required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false, minimize: false },
);
revisionSchema.index({ resource: 1, documentId: 1, createdAt: -1 });
revisionSchema.index({ action: 1, resource: 1, createdAt: -1 });

export const Revision = model("Revision", revisionSchema, "revisions");
