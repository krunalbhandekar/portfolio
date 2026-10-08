import { z } from "zod";

export const CONTACT_REASONS = ["job", "freelance", "collaboration", "other"] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.email("Please enter a valid email").max(200),
  subject: z.string().trim().max(150).default(""),
  reason: z.enum(CONTACT_REASONS).default("other"),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(5000),
  /** Honeypot: hidden from humans, so any value means a bot. */
  website: z.string().max(200).default(""),
});
