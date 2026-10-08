import type { FieldValues, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";

/** Keeps only the keys the form manages, filling gaps from `defaults` (server docs carry extras). */
export function toFormValues(
  defaults: Record<string, unknown>,
  doc: Record<string, unknown> | undefined,
) {
  const values: Record<string, unknown> = {};
  for (const key of Object.keys(defaults)) {
    const value = doc?.[key];
    values[key] = value === undefined ? defaults[key] : value;
  }
  return values;
}

/**
 * Maps the API's Zod errors (`details: [{ path: "avatar.alt", message }]`) onto form fields,
 * so validation lives in one place (the server) without losing per-field feedback.
 */
export function handleSaveError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
) {
  if (
    error instanceof ApiError &&
    error.code === "VALIDATION_ERROR" &&
    Array.isArray(error.details)
  ) {
    const details = error.details as { path: string; message: string }[];
    for (const { path, message } of details) {
      if (path) setError(path as never, { type: "server", message });
    }
    toast.error("Please fix the highlighted fields", {
      description: details
        .slice(0, 3)
        .map((d) => (d.path ? `${d.path}: ${d.message}` : d.message))
        .join(" · "),
    });
    return;
  }
  toast.error("Couldn't save", { description: error instanceof Error ? error.message : undefined });
}
