import { model, Schema } from "mongoose";
import { mediaRefSchema } from "../shared/fields.js";
import { singletonFields, sub } from "../shared/mongoose.js";

const settingsSchema = new Schema(
  {
    ...singletonFields,
    name: String,
    role: String,
    tagline: String,
    location: String,
    email: String,
    phone: String,
    availabilityText: String,
    accentColor: String,
    socials: [sub({ platform: String, label: String, url: String })],
    announcement: sub({ enabled: Boolean, text: String, href: String }),
    calendarUrl: String,
    logo: mediaRefSchema,
    avatar: mediaRefSchema,
    seo: sub({ title: String, description: String, ogImage: mediaRefSchema }),
    recruiter: sub({
      experience: String,
      targetRoles: String,
      noticePeriod: String,
      workPreference: String,
      preferredLocations: String,
      relocation: String,
      workAuthorization: String,
      note: String,
    }),
  },
  { timestamps: true },
);

export const SiteSettings = model("SiteSettings", settingsSchema, "siteSettings");
