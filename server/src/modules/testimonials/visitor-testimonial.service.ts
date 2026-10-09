import type { Request } from "express";
import type { TokenPayload } from "google-auth-library";
import type { z } from "zod";
import { verifyGoogleIdToken } from "../../lib/google.js";
import { logger } from "../../lib/logger.js";
import { sendAdminEmail } from "../../lib/mailer.js";
import { AppError, unauthorized } from "../../utils/app-error.js";
import { Testimonial } from "./testimonial.model.js";
import type { visitorTestimonialSchema } from "./testimonial.schema.js";

type VisitorTestimonialInput = z.infer<typeof visitorTestimonialSchema>;

const alreadySubmitted = () =>
  new AppError(
    409,
    "ALREADY_SUBMITTED",
    "You've already submitted a testimonial with this Google account. Thank you!",
  );

/** Only Google-hosted profile pictures are stored (they're shown as-is, never re-uploaded). */
const googlePicture = (url: unknown) =>
  typeof url === "string" && /^https:\/\/[\w.-]+\.googleusercontent\.com\//.test(url) ? url : "";

async function verifiedVisitor(credential: string): Promise<TokenPayload & { email: string }> {
  const payload = await verifyGoogleIdToken(credential);
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw unauthorized(
      "Your Google sign-in expired or couldn't be verified. Please continue with Google again.",
      "INVALID_GOOGLE_TOKEN",
    );
  }
  return payload as TokenPayload & { email: string };
}

/** Step 1: who is this, and have they already submitted? Prefills the form. */
export async function verifyVisitor(credential: string) {
  const visitor = await verifiedVisitor(credential);
  const existing = await Testimonial.exists({ "submittedBy.googleId": visitor.sub });
  return {
    name: visitor.name ?? "",
    email: visitor.email,
    picture: googlePicture(visitor.picture),
    alreadySubmitted: !!existing,
  };
}

/** Step 2: store the testimonial as an unpublished draft and notify the owner. */
export async function submitVisitorTestimonial(req: Request, input: VisitorTestimonialInput) {
  // The Google token is re-verified, so the stored identity can't be spoofed by the form.
  const visitor = await verifiedVisitor(input.credential);

  // Bots that fill the honeypot get a normal-looking success, and nothing is stored.
  if (input.website) {
    logger.info({ ip: req.ip }, "Testimonial honeypot triggered");
    return { received: true };
  }
  if (await Testimonial.exists({ "submittedBy.googleId": visitor.sub })) throw alreadySubmitted();

  const last = await Testimonial.findOne({}, { order: 1 })
    .sort({ order: -1 })
    .lean<{ order?: number }>();
  try {
    // `status`/`order` come from the shared content plugin, which the model's type doesn't see.
    const doc: Record<string, unknown> = {
      quote: input.quote,
      name: input.name,
      role: input.role,
      company: input.company,
      relationship: input.relationship,
      linkedinUrl: input.linkedinUrl,
      status: "draft",
      order: (last?.order ?? -1) + 1,
      source: "visitor",
      submittedBy: {
        googleId: visitor.sub,
        email: visitor.email.toLowerCase(),
        picture: googlePicture(visitor.picture),
        submittedAt: new Date(),
      },
    };
    await Testimonial.create(doc);
  } catch (err) {
    // Two simultaneous submissions: the unique index lets only one through.
    if ((err as { code?: number }).code === 11000) throw alreadySubmitted();
    throw err;
  }

  const byline = [input.role, input.company].filter(Boolean).join(", ");
  void sendAdminEmail({
    subject: `[Portfolio] New testimonial to review — ${input.name}`,
    text: [
      `${input.name}${byline ? ` (${byline})` : ""} left a testimonial.`,
      `Google account: ${visitor.email} (verified)`,
      `Relationship: ${input.relationship}`,
      input.linkedinUrl ? `LinkedIn: ${input.linkedinUrl}` : null,
      "",
      `"${input.quote}"`,
      "",
      "It's saved as a draft. Review and publish it in Admin → Testimonials.",
    ]
      .filter((line) => line !== null)
      .join("\n"),
    replyTo: visitor.email,
  });

  return { received: true };
}
