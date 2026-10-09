"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { BadgeCheck, CircleCheck, LoaderCircle, Send } from "lucide-react";
import { GoogleSignInButton } from "@/components/admin/google-sign-in-button";
import { Callout } from "@/components/shared/callout";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";
import { TestimonialAvatar } from "./testimonial-avatar";

const RELATIONSHIPS = [
  { value: "client", label: "Client" },
  { value: "manager", label: "Manager" },
  { value: "colleague", label: "Colleague" },
  { value: "mentor", label: "Mentor" },
  { value: "other", label: "Other" },
];

const QUOTE_MIN = 30;
const QUOTE_MAX = 1000;

type Visitor = { name: string; email: string; picture: string; alreadySubmitted: boolean };
type Step = "signin" | "verifying" | "already" | "form" | "sending" | "sent";

const EMPTY_FORM = {
  name: "",
  role: "",
  company: "",
  relationship: "client",
  quote: "",
  linkedinUrl: "",
  website: "",
};

/**
 * Visitor testimonial flow: continue with Google (proves who they are; name and photo come
 * from their account), write the testimonial, and it's saved as a draft for the owner to
 * review. One testimonial per Google account.
 */
export function WriteTestimonial({ ownerName }: { ownerName: string }) {
  const id = useId();
  const [step, setStep] = useState<Step>("signin");
  const [credential, setCredential] = useState<string | null>(null);
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [slow, setSlow] = useState(false);

  /** Shows a "waking the server" note if Render's free tier takes a while. */
  async function withSlowNote<T>(work: () => Promise<T>) {
    const timer = setTimeout(() => setSlow(true), 4000);
    try {
      return await work();
    } finally {
      clearTimeout(timer);
      setSlow(false);
    }
  }

  async function onCredential(token: string) {
    setStep("verifying");
    setError(null);
    try {
      const data = await withSlowNote(() =>
        api.post<Visitor>("/testimonials/verify", { credential: token }, { refreshOn401: false }),
      );
      setCredential(token);
      setVisitor(data);
      // Keep anything already typed (e.g. when re-verifying after the sign-in expired).
      setForm((current) => ({ ...current, name: current.name || data.name }));
      setStep(data.alreadySubmitted ? "already" : "form");
    } catch (err) {
      setStep("signin");
      setError(
        err instanceof ApiError && err.code === "RATE_LIMITED"
          ? "Too many attempts. Please try again in a little while."
          : err instanceof Error
            ? err.message
            : "Google sign-in couldn't be verified. Please try again.",
      );
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!credential) return;
    setStep("sending");
    setError(null);
    setFieldErrors({});
    try {
      await withSlowNote(() =>
        api.post("/testimonials", { ...form, credential }, { refreshOn401: false }),
      );
      setStep("sent");
    } catch (err) {
      if (err instanceof ApiError && err.code === "INVALID_GOOGLE_TOKEN") {
        // Google ID tokens last about an hour: sign in again, the text is kept.
        setCredential(null);
        setStep("signin");
        setError("Your Google sign-in expired. Continue with Google again — your text is kept.");
        return;
      }
      if (err instanceof ApiError && err.code === "ALREADY_SUBMITTED") {
        setStep("already");
        return;
      }
      setStep("form");
      if (
        err instanceof ApiError &&
        err.code === "VALIDATION_ERROR" &&
        Array.isArray(err.details)
      ) {
        setFieldErrors(
          Object.fromEntries(
            (err.details as { path: string; message: string }[]).map((d) => [d.path, d.message]),
          ),
        );
        setError("Please check the highlighted fields.");
      } else if (err instanceof ApiError && err.code === "RATE_LIMITED") {
        setError("Too many attempts. Please try again in a little while.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    }
  }

  if (step === "sent") {
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-2xl border bg-card p-8">
        <CircleCheck className="size-8 text-brand-text" aria-hidden="true" />
        <h2 className="text-xl font-semibold">
          Thank you{visitor?.name ? `, ${firstName(visitor.name)}` : ""}!
        </h2>
        <p className="text-muted-foreground">
          Your testimonial was sent to {ownerName}. It will appear on the site once it&apos;s been
          reviewed.
        </p>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to the homepage
        </Link>
      </div>
    );
  }

  if (step === "already") {
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-2xl border bg-card p-8">
        <CircleCheck className="size-8 text-brand-text" aria-hidden="true" />
        <h2 className="text-xl font-semibold">You&apos;ve already left a testimonial</h2>
        <p className="text-muted-foreground">
          {visitor?.email ? (
            <>
              A testimonial from <span className="text-foreground">{visitor.email}</span> has
              already been received.
            </>
          ) : (
            "A testimonial from this Google account has already been received."
          )}{" "}
          Thank you! To change it, get in touch.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/contact" className={buttonVariants({ variant: "outline" })}>
            Contact {firstName(ownerName)}
          </Link>
          <Button variant="ghost" onClick={() => setStep("signin")}>
            Use another Google account
          </Button>
        </div>
      </div>
    );
  }

  if (step === "signin" || step === "verifying") {
    return (
      <div className="flex flex-col items-start gap-5 rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">First, confirm who you are</h2>
          <p className="text-sm text-muted-foreground">
            Your name and profile photo come from your Google account, and your testimonial shows a{" "}
            <BadgeCheck className="inline size-4 text-brand-text" aria-hidden="true" />{" "}
            <span className="text-foreground">Verified via Google</span> mark. Your email address is
            never shown.
          </p>
        </div>
        {step === "verifying" ? (
          <p role="status" className="flex h-11 items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Verifying your Google account…
          </p>
        ) : (
          <GoogleSignInButton onCredential={onCredential} />
        )}
        {slow ? <SlowNote /> : null}
        {error ? <Callout variant="warning">{error}</Callout> : null}
      </div>
    );
  }

  const field = (name: keyof typeof EMPTY_FORM) => ({
    id: `${id}-${name}`,
    name,
    value: form[name],
    onChange: (e: { target: { value: string } }) =>
      setForm((current) => ({ ...current, [name]: e.target.value })),
    "aria-invalid": fieldErrors[name] ? true : undefined,
    "aria-describedby": fieldErrors[name] ? `${id}-${name}-error` : undefined,
  });
  const errorText = (name: string) =>
    fieldErrors[name] ? (
      <p id={`${id}-${name}-error`} className="text-xs text-destructive">
        {fieldErrors[name]}
      </p>
    ) : null;
  const quoteLength = form.quote.trim().length;

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-5 rounded-2xl border bg-card p-6 sm:p-8"
      noValidate
    >
      {visitor ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-surface p-3">
          <TestimonialAvatar name={form.name || visitor.name} src={visitor.picture || null} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              {visitor.name || form.name}
              <BadgeCheck className="size-4 text-brand-text" aria-label="Verified via Google" />
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {visitor.email} · not shown publicly
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setCredential(null);
              setVisitor(null);
              setForm((current) => ({ ...current, name: "" }));
              setStep("signin");
            }}
          >
            Not you?
          </Button>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-name`} className="text-sm font-medium">
            Name
          </label>
          <Input {...field("name")} required maxLength={80} autoComplete="name" className="h-10" />
          {errorText("name")}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-relationship`} className="text-sm font-medium">
            How do you know {firstName(ownerName)}?
          </label>
          <select
            {...field("relationship")}
            className="h-10 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
          >
            {RELATIONSHIPS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-role`} className="text-sm font-medium">
            Your role <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input {...field("role")} maxLength={80} placeholder="Product Manager" className="h-10" />
          {errorText("role")}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-company`} className="text-sm font-medium">
            Company <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input
            {...field("company")}
            maxLength={80}
            autoComplete="organization"
            className="h-10"
          />
          {errorText("company")}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-quote`} className="text-sm font-medium">
          Your testimonial
        </label>
        <Textarea
          {...field("quote")}
          required
          rows={6}
          maxLength={QUOTE_MAX}
          placeholder={`What was it like working with ${firstName(ownerName)}? What did they deliver?`}
        />
        <div className="flex justify-between gap-3">
          {errorText("quote") ?? (
            <p className="text-xs text-muted-foreground">At least {QUOTE_MIN} characters.</p>
          )}
          <p className="shrink-0 font-mono text-xs text-muted-foreground">
            {quoteLength}/{QUOTE_MAX}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-linkedinUrl`} className="text-sm font-medium">
          LinkedIn profile <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Input
          {...field("linkedinUrl")}
          type="url"
          maxLength={300}
          placeholder="https://www.linkedin.com/in/…"
          className="h-10"
        />
        {errorText("linkedinUrl")}
      </div>

      {/* Honeypot: invisible to people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input {...field("website")} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {error ? <Callout variant="warning">{error}</Callout> : null}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" className="h-10 px-5" disabled={step === "sending"}>
          {step === "sending" ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Send aria-hidden="true" />
          )}
          {step === "sending" ? "Sending…" : "Submit testimonial"}
        </Button>
        {slow ? <SlowNote /> : null}
      </div>
    </form>
  );
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

function SlowNote() {
  return (
    <p role="status" className="text-xs text-muted-foreground">
      Waking up the server — this can take up to a minute.
    </p>
  );
}
