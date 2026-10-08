import { model, Schema, type InferSchemaType } from "mongoose";

const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    avatar: { type: String, trim: true },
    googleId: { type: String },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type AdminDoc = InferSchemaType<typeof adminSchema>;
export const Admin = model("Admin", adminSchema, "admins");
