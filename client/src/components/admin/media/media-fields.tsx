"use client";

import { useId, useState } from "react";
import { useController, useFieldArray, useFormContext } from "react-hook-form";
import { ArrowLeft, ArrowRight, ImagePlus, Replace, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldShell } from "@/components/admin/kit/fields";
import { toMediaRef, type MediaRef } from "@/lib/admin/types";
import { MediaPickerDialog } from "./media-picker-dialog";
import { MediaThumb } from "./media-thumb";

type MediaFieldProps = {
  name: string;
  label: string;
  folder: string;
  description?: string;
  accept?: "image" | "pdf";
  required?: boolean;
  wide?: boolean;
};

/** A single media reference (or null) with an editable alt text, required by the API. */
export function MediaField({
  name,
  label,
  folder,
  description,
  accept = "image",
  required,
  wide,
}: MediaFieldProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const { field, fieldState } = useController({ name });
  const value = field.value as MediaRef | null;
  const nestedAltError = (fieldState.error as { alt?: { message?: string } } | undefined)?.alt
    ?.message;

  return (
    <FieldShell
      id={id}
      label={label}
      description={description}
      error={nestedAltError ?? fieldState.error?.message}
      required={required}
      wide={wide}
    >
      {value ? (
        <div className="flex flex-col gap-2 rounded-xl border bg-surface p-3 sm:flex-row">
          <div className="w-full shrink-0 overflow-hidden rounded-lg border sm:w-44">
            <MediaThumb item={value} size={320} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <label className="text-xs text-muted-foreground" htmlFor={`${id}-alt`}>
              {accept === "pdf" ? "Title" : "Alt text"} <span className="text-destructive">*</span>
            </label>
            <Input
              id={`${id}-alt`}
              value={value.alt}
              maxLength={300}
              aria-invalid={nestedAltError || !value.alt ? true : undefined}
              onChange={(event) => field.onChange({ ...value, alt: event.target.value })}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
                <Replace aria-hidden="true" /> Replace
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => field.onChange(null)}>
                <Trash2 aria-hidden="true" /> Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          id={id}
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        >
          <ImagePlus className="size-4" aria-hidden="true" />
          {accept === "pdf" ? "Choose PDF" : "Choose image"}
        </button>
      )}
      <MediaPickerDialog
        open={open}
        onOpenChange={setOpen}
        folder={folder}
        accept={accept}
        onSelect={(media) => field.onChange(toMediaRef(media))}
      />
    </FieldShell>
  );
}

/** Ordered list of images with captions (project screenshots). */
export function GalleryField({
  name,
  label,
  folder,
  description,
}: Omit<MediaFieldProps, "accept">) {
  const [open, setOpen] = useState(false);
  const { control, register, formState } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const errors = (formState.errors as Record<string, unknown>)[name] as
    ({ alt?: { message?: string } } | undefined)[] | undefined;

  return (
    <div className="flex flex-col gap-3 sm:col-span-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <ImagePlus aria-hidden="true" /> Add image
        </Button>
      </div>
      {fields.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-xs text-muted-foreground">
          No screenshots yet.
        </p>
      ) : (
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((item, index) => {
            const ref = item as unknown as MediaRef & { id: string };
            const altError = errors?.[index]?.alt?.message;
            return (
              <li key={item.id} className="flex flex-col gap-2 rounded-xl border bg-surface p-2">
                <div className="overflow-hidden rounded-lg border">
                  <MediaThumb item={ref} size={320} />
                </div>
                <Input
                  aria-label={`Screenshot ${index + 1} alt text`}
                  placeholder="Alt text *"
                  aria-invalid={altError ? true : undefined}
                  {...register(`${name}.${index}.alt`)}
                />
                {altError ? <p className="text-xs text-destructive">{altError}</p> : null}
                <Input
                  aria-label={`Screenshot ${index + 1} caption`}
                  placeholder="Caption (optional)"
                  {...register(`${name}.${index}.caption`)}
                />
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">#{index + 1}</span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Move left"
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      <ArrowLeft />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Move right"
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      <ArrowRight />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Remove screenshot"
                      onClick={() => remove(index)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <MediaPickerDialog
        open={open}
        onOpenChange={setOpen}
        folder={folder}
        onSelect={(media) => append({ ...toMediaRef(media), caption: "" })}
      />
    </div>
  );
}
