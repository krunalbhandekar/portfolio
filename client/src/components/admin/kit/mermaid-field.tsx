"use client";

import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import { MermaidDiagram } from "@/components/projects/mermaid-diagram";
import { TextareaField } from "./fields";

/** Mermaid source with a live preview (re-rendered 600 ms after typing stops). */
export function MermaidField({
  name,
  label,
  description,
}: {
  name: string;
  label: string;
  description?: string;
}) {
  const source = (useWatch({ name }) as string | undefined) ?? "";
  const [debounced, setDebounced] = useState(source);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(source), 600);
    return () => clearTimeout(timeout);
  }, [source]);

  return (
    <div className="grid gap-4 sm:col-span-2 lg:grid-cols-2">
      <TextareaField
        name={name}
        label={label}
        rows={10}
        maxLength={10000}
        description={description ?? "Mermaid syntax, e.g. `graph LR; A[Client] --> B[API]`."}
        className="font-mono"
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Preview</span>
        {debounced.trim() ? (
          <MermaidDiagram key={debounced} source={debounced} title={label} />
        ) : (
          <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed text-xs text-muted-foreground">
            The diagram renders here as you type.
          </div>
        )}
      </div>
    </div>
  );
}
