import { model, Schema } from "mongoose";
import { contentFieldsPlugin } from "../../plugins/content-fields.js";
import { mediaRefSchema } from "../shared/fields.js";
import { sub } from "../shared/mongoose.js";

const galleryItemSchema = mediaRefSchema.clone();
galleryItemSchema.add({ caption: String });

const projectSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  summary: String,
  category: String,
  type: String,
  role: String,
  duration: String,
  startDate: Date,
  endDate: Date,
  teamSize: Number,
  projectStatus: String,
  technologies: [String],
  featured: { type: Boolean, default: false },
  confidential: { type: Boolean, default: false },
  thumbnail: mediaRefSchema,
  gallery: [galleryItemSchema],
  videoUrl: String,
  liveUrl: String,
  repoUrl: String,
  demoCredentials: sub({ username: String, password: String, note: String }),
  problem: String,
  solution: String,
  contributions: [String],
  features: [String],
  architecture: sub({ description: String, diagram: String, image: mediaRefSchema }),
  challenges: [sub({ challenge: String, solution: String, result: String })],
  decisions: [sub({ question: String, answer: String })],
  metrics: [sub({ label: String, value: String })],
  experienceId: { type: Schema.Types.ObjectId, ref: "Experience" },
});
projectSchema.plugin(contentFieldsPlugin);
projectSchema.index({ status: 1, featured: 1, order: 1 });
projectSchema.index({ title: "text", summary: "text", technologies: "text", features: "text" });

export const Project = model("Project", projectSchema, "projects");
