import { model, Schema, type InferSchemaType } from "mongoose";

const auditLogSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "Admin", index: true },
    /** Dotted verb, e.g. `auth.login`, `auth.logout`, `projects.update`. */
    action: { type: String, required: true, index: true },
    outcome: { type: String, enum: ["success", "failure"], default: "success" },
    entity: { type: String },
    entityId: { type: Schema.Types.ObjectId },
    meta: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });

export type AuditLogDoc = InferSchemaType<typeof auditLogSchema>;
export const AuditLog = model("AuditLog", auditLogSchema, "auditLogs");
