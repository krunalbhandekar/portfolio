import type { Request } from "express";
import type { z } from "zod";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import type { contactSchema } from "./contact.schema.js";
import { Message } from "./message.model.js";

type ContactInput = z.infer<typeof contactSchema>;

const REASON_LABELS: Record<string, string> = {
  job: "Job opportunity",
  freelance: "Freelance",
  collaboration: "Collaboration",
  other: "Other",
};

/** Notification email via Resend's HTTP API. Never throws: the message is already stored. */
async function sendNotification(input: ContactInput) {
  if (!env.RESEND_API_KEY) {
    logger.warn("RESEND_API_KEY not set; contact message stored but not emailed");
    return false;
  }
  const lines = [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Reason: ${REASON_LABELS[input.reason] ?? input.reason}`,
    input.subject ? `Subject: ${input.subject}` : null,
    "",
    input.message,
  ].filter((line) => line !== null);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to: [env.CONTACT_NOTIFY_EMAIL],
        reply_to: input.email,
        subject: `[Portfolio] ${input.subject || REASON_LABELS[input.reason] || "New message"} — ${input.name}`,
        text: lines.join("\n"),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok)
      throw new Error(`Resend responded ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return true;
  } catch (err) {
    logger.error({ err }, "Failed to send contact notification");
    return false;
  }
}

export async function submitContact(req: Request, input: ContactInput) {
  // Bots that fill the honeypot get a normal-looking success, and nothing is stored.
  if (input.website) {
    logger.info({ ip: req.ip }, "Contact honeypot triggered");
    return { received: true };
  }
  const message = await Message.create({
    name: input.name,
    email: input.email,
    subject: input.subject,
    reason: input.reason,
    message: input.message,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  const emailed = await sendNotification(input);
  if (emailed) await Message.updateOne({ _id: message._id }, { emailed: true });
  return { received: true };
}
