import { model, Schema, type InferSchemaType } from "mongoose";

const usageSchema = new Schema(
  {
    resource: { type: String, required: true },
    documentId: { type: Schema.Types.ObjectId, required: true },
    /** Human-readable label for the library's "Used in" list, e.g. the project title. */
    label: { type: String },
  },
  { _id: false },
);

const mediaSchema = new Schema(
  {
    publicId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    resourceType: { type: String, enum: ["image", "raw"], default: "image" },
    format: { type: String },
    folder: { type: String, required: true, index: true },
    bytes: { type: Number },
    width: { type: Number },
    height: { type: Number },
    alt: { type: String, required: true, trim: true },
    originalFilename: { type: String },
    usedIn: { type: [usageSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true },
);

mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ "usedIn.documentId": 1 });

export type MediaDoc = InferSchemaType<typeof mediaSchema>;
export const Media = model("Media", mediaSchema, "media");
