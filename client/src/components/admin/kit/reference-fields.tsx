"use client";

import { useId, useState } from "react";
import { useController } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useResourceOptions } from "@/lib/admin/resource-api";
import { FieldShell, selectClass, type SelectOption } from "./fields";

/** Single reference (stores an id or null), e.g. a project's related experience. */
export function ReferenceSelectField({
  name,
  label,
  apiPath,
  description,
  placeholder = "None",
}: {
  name: string;
  label: string;
  apiPath: string;
  description?: string;
  placeholder?: string;
}) {
  const id = useId();
  const { field, fieldState } = useController({ name });
  const options = useResourceOptions(apiPath);
  return (
    <FieldShell id={id} label={label} description={description} error={fieldState.error?.message}>
      <select
        id={id}
        className={selectClass}
        value={(field.value as string | null) ?? ""}
        onChange={(event) => field.onChange(event.target.value || null)}
        onBlur={field.onBlur}
      >
        <option value="">{options.isPending ? "Loading…" : placeholder}</option>
        {options.data?.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
            {option.status === "draft" ? " (draft)" : ""}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/**
 * Ordered multi-reference (stores an array of ids or slugs). The selected list is reorderable;
 * `valueKey: "slug"` stores slugs instead of ids (e.g. skills).
 */
export function ReferenceListField({
  name,
  label,
  apiPath,
  description,
  max,
  valueKey = "id",
  wide = true,
}: {
  name: string;
  label: string;
  apiPath: string;
  description?: string;
  max?: number;
  valueKey?: "id" | "slug";
  wide?: boolean;
}) {
  const id = useId();
  const { field, fieldState } = useController({ name });
  const options = useResourceOptions(apiPath);
  const [filter, setFilter] = useState("");
  const selected: string[] = Array.isArray(field.value) ? (field.value as string[]) : [];
  const all: SelectOption[] =
    options.data?.map((o) => ({
      value: (valueKey === "slug" ? o.slug : o.id) ?? o.id,
      label: o.label,
    })) ?? [];
  const labelOf = (value: string) => all.find((o) => o.value === value)?.label ?? value;
  const available = all.filter(
    (o) => !selected.includes(o.value) && o.label.toLowerCase().includes(filter.toLowerCase()),
  );
  const atMax = max !== undefined && selected.length >= max;

  const move = (from: number, to: number) => {
    const next = [...selected];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    field.onChange(next);
  };

  return (
    <FieldShell
      id={id}
      label={label}
      description={description}
      error={fieldState.error?.message}
      wide={wide}
    >
      <div className="grid gap-3 rounded-xl border bg-surface p-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs text-muted-foreground">
            Selected ({selected.length}
            {max ? `/${max}` : ""})
          </p>
          {selected.length === 0 ? (
            <p className="text-xs text-muted-foreground">None selected.</p>
          ) : (
            <ol className="flex flex-col gap-1">
              {selected.map((value, index) => (
                <li
                  key={value}
                  className="flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">{labelOf(value)}</span>
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={index === selected.length - 1}
                    onClick={() => move(index, index + 1)}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${labelOf(value)}`}
                    onClick={() => field.onChange(selected.filter((v) => v !== value))}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Input
            id={id}
            placeholder={options.isPending ? "Loading…" : "Search to add…"}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
          <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
            {available.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  disabled={atMax}
                  onClick={() => field.onChange([...selected, option.value])}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
                >
                  <Plus className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{option.label}</span>
                </button>
              </li>
            ))}
            {options.isSuccess && available.length === 0 ? (
              <li className="px-2 text-xs text-muted-foreground">Nothing to add.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </FieldShell>
  );
}
