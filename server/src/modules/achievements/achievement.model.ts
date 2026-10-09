import { model, Schema } from "mongoose";
import { contentFieldsPlugin } from "../../plugins/content-fields.js";

const achievementSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  metric: String,
  date: Date,
  projectId: { type: Schema.Types.ObjectId, ref: "Project" },
});
achievementSchema.plugin(contentFieldsPlugin);

export const Achievement = model("Achievement", achievementSchema, "achievements");
