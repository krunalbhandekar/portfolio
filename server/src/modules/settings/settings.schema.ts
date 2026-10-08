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
export const AVAILABILITY = ["open", "freelance", "not-looking"] as const;

export const settingsInput = z.object({
  name: requiredText(80),
  role: requiredText(80),
  tagline: text(160),
  location: text(80),
  timezone: text(60),
  email: z.union([z.literal(""), z.email()]).default(""),
  phone: text(30),
  availability: z
    .object({ status: z.enum(AVAILABILITY).default("open"), label: text(60) })
    .default({ status: "open", label: "" }),
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
});
