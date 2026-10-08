import { model, Schema } from "mongoose";
import { singletonFields, sub } from "../shared/mongoose.js";

const homepageSchema = new Schema(
  {
    ...singletonFields,
    hero: sub({
      eyebrow: String,
      headline: String,
      subheadline: String,
      positioning: String,
      stack: [String],
    }),
    ctas: [sub({ label: String, href: String, variant: String })],
    stats: [sub({ value: String, label: String })],
    bento: [sub({ kind: String, title: String, body: String, href: String, size: String })],
    expertise: [sub({ area: String, summary: String, skills: [String] })],
    sections: [sub({ key: String, visible: Boolean })],
    featuredProjectIds: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    nowSnippet: String,
  },
  { timestamps: true },
);

export const Homepage = model("Homepage", homepageSchema, "homepage");
