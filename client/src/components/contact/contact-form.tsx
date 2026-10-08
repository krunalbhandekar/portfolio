"use client";

import { useId, useState, type FormEvent } from "react";
import { CircleCheck, LoaderCircle, Send } from "lucide-react";
import { Callout } from "@/components/shared/callout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";

const REASONS = [
  { value: "job", label: "Job opportunity" },
  { value: "freelance", label: "Freelance project" },
  { value: "collaboration", label: "Collaboration" },
  { value: "other", label: "Something else" },
];

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, string>;
    setStatus("sending");
    setError(null);
    setFieldErrors({});
    // Render's free tier may be asleep: after a few seconds, explain the wait.
    const slowTimer = setTimeout(() => setSlow(true), 4000);
    try {
      await api.post("/contact", payload, { refreshOn401: false });
      setStatus("sent");
    } catch (err) {
      setStatus("error");
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
        setError(
          "You've sent several messages recently. Please try again later or email me directly.",
        );
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-2xl border bg-card p-8">
        <CircleCheck className="size-8 text-brand-text" aria-hidden="true" />
        <h2 className="text-xl font-semibold">Message sent — thank you!</h2>
        <p className="text-muted-foreground">
          I&apos;ll get back to you as soon as I can, usually within a day or two.
        </p>
        <Button variant="outline" onClick={() => setStatus("idle")}>
          Send another
        </Button>
      </div>
    );
  }

  const field = (name: string) => ({
    id: `${id}-${name}`,
    name,
    "aria-invalid": fieldErrors[name] ? true : undefined,
    "aria-describedby": fieldErrors[name] ? `${id}-${name}-error` : undefined,
  });
  const errorText = (name: string) =>
    fieldErrors[name] ? (
      <p id={`${id}-${name}-error`} className="text-xs text-destructive">
        {fieldErrors[name]}
      </p>
    ) : null;

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-5 rounded-2xl border bg-card p-6 sm:p-8"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-name`} className="text-sm font-medium">
            Name
          </label>
          <Input {...field("name")} required autoComplete="name" className="h-10" />
          {errorText("name")}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-email`} className="text-sm font-medium">
            Email
          </label>
          <Input {...field("email")} type="email" required autoComplete="email" className="h-10" />
          {errorText("email")}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-reason`} className="text-sm font-medium">
            Reason
          </label>
          <select
            {...field("reason")}
            defaultValue="job"
            className="h-10 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-subject`} className="text-sm font-medium">
            Subject <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input {...field("subject")} maxLength={150} className="h-10" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-message`} className="text-sm font-medium">
          Message
        </label>
        <Textarea {...field("message")} required rows={6} maxLength={5000} />
        {errorText("message")}
      </div>
      {/* Honeypot: invisible to people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input
          id={`${id}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      {error ? <Callout variant="warning">{error}</Callout> : null}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" className="h-10 px-5" disabled={status === "sending"}>
          {status === "sending" ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Send aria-hidden="true" />
          )}
          {status === "sending" ? "Sending…" : "Send message"}
        </Button>
        {slow ? (
          <p role="status" className="text-xs text-muted-foreground">
            Waking up the server — this can take up to a minute on the first message.
          </p>
        ) : null}
      </div>
    </form>
  );
}
