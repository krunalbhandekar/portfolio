import { Schema, type SchemaDefinition } from "mongoose";

/** Nested object/array-item schema without its own `_id`. */
export const sub = (definition: SchemaDefinition) => new Schema(definition, { _id: false });

/** Common fields for singleton documents (site settings, homepage, about). */
export const singletonFields = {
  key: { type: String, required: true, unique: true, default: "default" },
  updatedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
} as const;
