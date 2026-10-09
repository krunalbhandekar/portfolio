import { model, Schema } from "mongoose";
import { contentFieldsPlugin } from "../../plugins/content-fields.js";

const builtFeatureSchema = new Schema({
  feature: { type: String, required: true },
  description: String,
  area: String,
  technologies: [String],
  projectId: { type: Schema.Types.ObjectId, ref: "Project" },
});
builtFeatureSchema.plugin(contentFieldsPlugin);
builtFeatureSchema.index({ feature: "text", description: "text", technologies: "text" });

export const BuiltFeature = model("BuiltFeature", builtFeatureSchema, "builtFeatures");
