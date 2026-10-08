import { model, Schema } from "mongoose";
import { contentFieldsPlugin } from "../../plugins/content-fields.js";

const capabilitySchema = new Schema({
  name: { type: String, required: true },
  description: String,
  relatedSkills: [String],
});
capabilitySchema.plugin(contentFieldsPlugin);

export const Capability = model("Capability", capabilitySchema, "capabilities");
