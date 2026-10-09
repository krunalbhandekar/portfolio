import { model, Schema } from "mongoose";
import { contentFieldsPlugin } from "../../plugins/content-fields.js";
import { flowDiagramSchema } from "../shared/fields.js";
import { sub } from "../shared/mongoose.js";

const engineeringSchema = new Schema({
  type: { type: String, required: true, index: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  summary: String,
  content: String,
  diagram: String,
  flow: flowDiagramSchema,
  projectId: { type: Schema.Types.ObjectId, ref: "Project" },
  api: sub({
    method: String,
    path: String,
    auth: String,
    params: [
      sub({
        name: String,
        location: String,
        type: { type: String },
        required: Boolean,
        description: String,
      }),
    ],
    requestExample: String,
    responseExample: String,
    statusCodes: [sub({ code: String, description: String })],
  }),
});
engineeringSchema.plugin(contentFieldsPlugin);

export const EngineeringItem = model("EngineeringItem", engineeringSchema, "engineeringItems");
