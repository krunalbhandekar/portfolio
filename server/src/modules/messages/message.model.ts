import { model, Schema, type InferSchemaType } from "mongoose";

const messageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String },
    reason: { type: String },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    emailed: { type: Boolean, default: false },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

messageSchema.index({ archived: 1, createdAt: -1 });

export type MessageDoc = InferSchemaType<typeof messageSchema>;
export const Message = model("Message", messageSchema, "messages");
