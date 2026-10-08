import type { Request } from "express";
import type { Types } from "mongoose";
import { logger } from "../../lib/logger.js";
import { AuditLog } from "./audit-log.model.js";

type AuditEntry = {
  action: string;
  outcome?: "success" | "failure";
  adminId?: Types.ObjectId;
  entity?: string;
  entityId?: Types.ObjectId;
  meta?: Record<string, unknown>;
};

/** Records an audit event. Never throws: a logging failure must not break the request. */
export async function recordAudit(req: Request, entry: AuditEntry) {
  try {
    await AuditLog.create({ ...entry, ip: req.ip, userAgent: req.get("user-agent") });
  } catch (err) {
    logger.error({ err, action: entry.action }, "Failed to write audit log");
  }
}
