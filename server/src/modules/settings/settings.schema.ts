import { z } from "zod";
import { href, httpUrl, nullableMediaRef, requiredText, text } from "../shared/fields.js";

export const SOCIAL_PLATFORMS = [
  "github",
  "linkedin",
  "x",
  "youtube",
  "website",
  "email",
  "other",
] as const;

export const RECRUITER_DEFAULTS = {
  experience: "",
  targetRoles: "",
  noticePeriod: "",
  workPreference: "",
  preferredLocations: "",
  relocation: "",
  workAuthorization: "",
  note: "",
};

export const settingsInput = z.object({
  name: requiredText(80),
  role: requiredText(80),
  tagline: text(160),
  location: text(80),
  email: z.union([z.literal(""), z.email()]).default(""),
  phone: text(30),
  /** Availability badge text, e.g. "Open to opportunities". Empty hides the badge. */
  availabilityText: text(60),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour, e.g. #34d399")
    .default("#34d399"),
  socials: z
    .array(
      z.object({
        platform: z.enum(SOCIAL_PLATFORMS),
        label: requiredText(40),
        url: z
          .string()
          .trim()
          .regex(/^(https?:\/\/|mailto:)/, "Use https://… or mailto:")
          .max(300),
      }),
    )
    .max(10)
    .default([]),
  announcement: z
    .object({ enabled: z.boolean().default(false), text: text(160), href })
    .default({ enabled: false, text: "", href: "" }),
  calendarUrl: httpUrl,
  logo: nullableMediaRef,
  avatar: nullableMediaRef,
  seo: z
    .object({ title: text(70), description: text(160), ogImage: nullableMediaRef })
    .default({ title: "", description: "", ogImage: null }),
  /** Recruiter FAQ (portfolio.md §4 #17), shown on /hire. Empty answers are hidden. */
  recruiter: z
    .object({
      experience: text(60),
      targetRoles: text(120),
      noticePeriod: text(60),
      workPreference: text(80),
      preferredLocations: text(120),
      relocation: text(80),
      workAuthorization: text(120),
      note: text(300),
    })
    .default(RECRUITER_DEFAULTS),
});
