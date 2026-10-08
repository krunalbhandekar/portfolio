import { model, Schema } from "mongoose";
import { mediaRefSchema } from "../shared/fields.js";
import { singletonFields, sub } from "../shared/mongoose.js";

const aboutSchema = new Schema(
  {
    ...singletonFields,
    headline: String,
    story: String,
    portrait: mediaRefSchema,
    education: [
      sub({
        institution: String,
        degree: String,
        field: String,
        startYear: String,
        endYear: String,
        description: String,
      }),
    ],
    journey: [sub({ period: String, title: String, description: String })],
    values: [sub({ title: String, description: String })],
    domains: [String],
  },
  { timestamps: true },
);

export const About = model("About", aboutSchema, "about");
