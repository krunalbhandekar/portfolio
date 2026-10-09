import type { Request } from "express";
import type { z } from "zod";
import { logger } from "../../lib/logger.js";
import { sendAdminEmail } from "../../lib/mailer.js";
import type { contactSchema } from "./contact.schema.js";
import { Message } from "./message.model.js";

type ContactInput = z.infer<typeof contactSchema>;

const REASON_LABELS: Record<string, string> = {
  job: "Job opportunity",
  freelance: "Freelance",
  collaboration: "Collaboration",
  other: "Other",
};

/** Notification email. Never throws: the message is already stored. */
function sendNotification(input: ContactInput) {
  const lines = [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Reason: ${REASON_LABELS[input.reason] ?? input.reason}`,
    input.subject ? `Subject: ${input.subject}` : null,
    "",
    input.message,
  ].filter((line) => line !== null);
  return sendAdminEmail({
    subject: `[Portfolio] ${input.subject || REASON_LABELS[input.reason] || "New message"} — ${input.name}`,
    text: lines.join("\n"),
    replyTo: input.email,
  });
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
