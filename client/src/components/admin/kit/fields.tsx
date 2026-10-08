"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  useController,
  useFieldArray,
  useFormContext,
  type ArrayPath,
  type FieldValues,
} from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/*
 * Form fields bound to the surrounding <FormProvider>. Validation is server-driven: the API's
 * Zod errors are mapped onto these fields by path (see resources/apply-server-errors.ts).
 */

type BaseProps = {
  name: string;
  label: string;
  description?: ReactNode;
  required?: boolean;
  className?: string;
  /** Span both columns of a FormSection grid. */
  wide?: boolean;
};

export function FieldShell({
  id,
  label,
  description,
  error,
  required,
  className,
  wide,
  children,
}: {
  id: string;
  label: string;
  description?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", wide && "sm:col-span-2", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : description ? (
        <p id={`${id}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function useBoundField(name: string) {
  const id = useId();
  // Flatten the controller so render code never reads off the object that carries `ref`
  // (the React Compiler lint treats that whole object as a ref).
  const {
    field: { ref: inputRef, value, onChange, onBlur, name: fieldName },
    fieldState,
  } = useController({ name });
  const error = fieldState.error?.message;
  const aria = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : `${id}-description`,
  };
  return { id, inputRef, value: value as unknown, onChange, onBlur, fieldName, error, aria };
}

export function TextField({
  type = "text",
  placeholder,
  maxLength,
  ...props
}: BaseProps & {
  type?: "text" | "url" | "email" | "tel";
  placeholder?: string;
  maxLength?: number;
}) {
  const { id, inputRef, value, onChange, onBlur, fieldName, error, aria } = useBoundField(
    props.name,
  );
  return (
    <FieldShell id={id} error={error} {...props}>
      <Input
        {...aria}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        required={props.required}
        name={fieldName}
        ref={inputRef}
        value={(value as string | null | undefined) ?? ""}
        onChange={onChange}
        onBlur={onBlur}
      />
    </FieldShell>
  );
}

export function TextareaField({
  rows = 3,
  placeholder,
  maxLength,
  ...props
}: BaseProps & { rows?: number; placeholder?: string; maxLength?: number }) {
  const {
    id,
    inputRef,
    value: raw,
    onChange,
    onBlur,
    fieldName,
    error,
    aria,
  } = useBoundField(props.name);
  const value = (raw as string | null | undefined) ?? "";
  return (
    <FieldShell
      id={id}
      error={error}
      {...props}
      description={
        maxLength ? (
          <>
            {props.description}{" "}
            <span className="tabular-nums">
              ({value.length}/{maxLength})
            </span>
          </>
        ) : (
          props.description
        )
      }
    >
      <Textarea
        {...aria}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
        required={props.required}
        name={fieldName}
        ref={inputRef}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
    </FieldShell>
  );
}

export function NumberField({ min, max, ...props }: BaseProps & { min?: number; max?: number }) {
  const { id, inputRef, value, onChange, onBlur, fieldName, error, aria } = useBoundField(
    props.name,
  );
  return (
    <FieldShell id={id} error={error} {...props}>
      <Input
        {...aria}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        name={fieldName}
        ref={inputRef}
        value={value === null || value === undefined ? "" : String(value)}
        onChange={(event) =>
          onChange(event.target.value === "" ? null : Number(event.target.value))
        }
        onBlur={onBlur}
      />
    </FieldShell>
  );
}

/** Date input; stored as "YYYY-MM-DD" (or null when empty). */
export function DateField(props: BaseProps) {
  const { id, inputRef, value, onChange, onBlur, fieldName, error, aria } = useBoundField(
    props.name,
  );
  return (
    <FieldShell id={id} error={error} {...props}>
      <Input
        {...aria}
        type="date"
        required={props.required}
        name={fieldName}
        ref={inputRef}
        value={value ? String(value).slice(0, 10) : ""}
        onChange={(event) => onChange(event.target.value || null)}
        onBlur={onBlur}
      />
    </FieldShell>
  );
}

export const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30";

export type SelectOption = { value: string; label: string };

export function SelectField({
  options,
  placeholder,
  ...props
}: BaseProps & { options: readonly SelectOption[]; placeholder?: string }) {
  const { id, inputRef, value, onChange, onBlur, fieldName, error, aria } = useBoundField(
    props.name,
  );
  return (
    <FieldShell id={id} error={error} {...props}>
      <select
        {...aria}
        className={selectClass}
        required={props.required}
        name={fieldName}
        ref={inputRef}
        value={(value as string | null) ?? ""}
        onChange={(event) => onChange(event.target.value === "" ? null : event.target.value)}
        onBlur={onBlur}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function SwitchField({ name, label, description, className, wide }: BaseProps) {
  const id = useId();
  const {
    field: { value, onChange, onBlur },
  } = useController({ name });
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-xl border bg-surface px-4 py-3",
        wide && "sm:col-span-2",
        className,
      )}
    >
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <Switch
        id={id}
        checked={Boolean(value)}
        onCheckedChange={(checked) => onChange(checked)}
        onBlur={onBlur}
      />
    </div>
  );
}

export function ColorField(props: BaseProps) {
  const {
    id,
    inputRef,
    value: raw,
    onChange,
    onBlur,
    fieldName,
    error,
    aria,
  } = useBoundField(props.name);
  const value = (raw as string | null) ?? "";
  return (
    <FieldShell id={id} error={error} {...props}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${props.label} picker`}
          className="size-8 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
        />
        <Input
          {...aria}
          className="font-mono"
          name={fieldName}
          ref={inputRef}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="#34d399"
        />
      </div>
    </FieldShell>
  );
}

/**
 * Chips input for string arrays (technologies, domains…). Enter or comma adds a value.
 * `normalize` (e.g. slugify) is applied to typed values; `suggestions` power a datalist.
 */
export function TagsField({
  suggestions = [],
  normalize = (value: string) => value.trim(),
  placeholder = "Type and press Enter",
  ...props
}: BaseProps & {
  suggestions?: SelectOption[];
  normalize?: (value: string) => string;
  placeholder?: string;
}) {
  const { id, inputRef, value, onChange, onBlur, error, aria } = useBoundField(props.name);
  const [draft, setDraft] = useState("");
  const values: string[] = Array.isArray(value) ? (value as string[]) : [];
  const labelFor = (value: string) => suggestions.find((s) => s.value === value)?.label ?? value;
  const listId = `${id}-suggestions`;

  const add = (raw: string) => {
    // Accept either a suggestion's label or its value.
    const match = suggestions.find((s) => s.label.toLowerCase() === raw.trim().toLowerCase());
    const value = match ? match.value : normalize(raw);
    if (value && !values.includes(value)) onChange([...values, value]);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if ((event.key === "Enter" || event.key === ",") && draft.trim()) {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <FieldShell id={id} error={error} {...props}>
      <div className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-lg border border-input px-1.5 py-1 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex h-6 items-center gap-1 rounded-md bg-muted pr-1 pl-2 font-mono text-xs"
          >
            {labelFor(value)}
            <button
              type="button"
              aria-label={`Remove ${labelFor(value)}`}
              className="rounded text-muted-foreground hover:text-foreground"
              onClick={() => onChange(values.filter((v) => v !== value))}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          {...aria}
          list={suggestions.length ? listId : undefined}
          className="h-6 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none"
          placeholder={values.length ? "" : placeholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (draft.trim()) add(draft);
            onBlur();
          }}
          ref={inputRef}
        />
        {suggestions.length ? (
          <datalist id={listId}>
            {suggestions
              .filter((s) => !values.includes(s.value))
              .map((s) => (
                <option key={s.value} value={s.label} />
              ))}
          </datalist>
        ) : null}
      </div>
    </FieldShell>
  );
}

/** One list item per line (responsibilities, achievements, features…). */
export function LinesField({ rows = 5, ...props }: BaseProps & { rows?: number }) {
  const { id, inputRef, value, onChange, onBlur, fieldName, error, aria } = useBoundField(
    props.name,
  );
  const values: string[] = Array.isArray(value) ? (value as string[]) : [];
  const [text, setText] = useState(values.join("\n"));
  const [synced, setSynced] = useState(values);
  // Re-sync when the form is reset (e.g. after loading or saving).
  if (synced !== values && values.join("\n") !== text.split("\n").filter(Boolean).join("\n")) {
    setSynced(values);
    setText(values.join("\n"));
  }
  return (
    <FieldShell
      id={id}
      error={error}
      {...props}
      description={props.description ?? "One item per line."}
    >
      <Textarea
        {...aria}
        rows={rows}
        name={fieldName}
        ref={inputRef}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          onChange(
            event.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          );
        }}
        onBlur={onBlur}
      />
    </FieldShell>
  );
}

/**
 * Repeating group of fields (challenges, metrics, CTAs…). `render` receives the item's path
 * prefix, e.g. "challenges.2", to build nested field names.
 */
export function RepeaterField<T extends FieldValues>({
  name,
  label,
  description,
  newItem,
  render,
  itemLabel,
  max,
  addLabel = "Add item",
}: {
  name: string;
  label: string;
  description?: ReactNode;
  newItem: () => Record<string, unknown>;
  render: (prefix: string, index: number) => ReactNode;
  itemLabel?: (index: number) => string;
  max?: number;
  addLabel?: string;
}) {
  const { control } = useFormContext<T>();
  const { fields, append, remove, move } = useFieldArray({ control, name: name as ArrayPath<T> });
  const atMax = max !== undefined && fields.length >= max;

  return (
    <div className="flex flex-col gap-3 sm:col-span-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={atMax}
          onClick={() => append(newItem() as never)}
        >
          <Plus aria-hidden="true" />
          {addLabel}
        </Button>
      </div>
      {fields.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-5 text-center text-xs text-muted-foreground">
          Nothing added yet.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {fields.map((item, index) => (
            <li key={item.id} className="rounded-xl border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {itemLabel ? itemLabel(index) : `#${index + 1}`}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Move down"
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Remove"
                    onClick={() => remove(index)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">{render(`${name}.${index}`, index)}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
