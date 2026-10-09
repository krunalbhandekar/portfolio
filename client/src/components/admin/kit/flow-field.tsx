"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useWatch } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { FLOW_KIND_LABELS, type FlowData } from "@/components/diagrams/flow-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RepeaterField, SelectField, TextField, TextareaField } from "./fields";

const InteractiveDiagram = dynamic(() => import("@/components/diagrams/interactive-diagram"), {
  ssr: false,
  loading: () => <Skeleton className="h-[440px] w-full rounded-xl" />,
});

const KIND_OPTIONS = Object.entries(FLOW_KIND_LABELS).map(([value, label]) => ({ value, label }));

/**
 * Editor for an interactive architecture diagram (portfolio.md §3.8): components (nodes) and
 * connections. Layout is automatic on the site; a live preview shows exactly what visitors get.
 */
export function FlowField({ name }: { name: string }) {
  const flow = (useWatch({ name }) as FlowData | undefined) ?? { nodes: [], edges: [] };
  const [preview, setPreview] = useState(false);
  const nodeOptions = flow.nodes
    .filter((n) => n.id)
    .map((n) => ({ value: n.id, label: n.label ? `${n.label} (${n.id})` : n.id }));
  const valid = flow.nodes.filter((n) => n.id && n.label);

  return (
    <>
      <RepeaterField
        name={`${name}.nodes`}
        label="Components"
        description="Each box in the diagram: browser, API, database, queue, third-party service…"
        max={30}
        addLabel="Add component"
        newItem={() => ({ id: "", label: "", kind: "service", description: "" })}
        itemLabel={(i) => flow.nodes[i]?.label || `Component ${i + 1}`}
        render={(prefix) => (
          <>
            <TextField name={`${prefix}.label`} label="Label" required placeholder="Orders API" />
            <TextField
              name={`${prefix}.id`}
              label="Key"
              required
              placeholder="orders-api"
              description="Short unique id used by connections (a-z, 0-9, -)."
            />
            <SelectField name={`${prefix}.kind`} label="Kind" options={KIND_OPTIONS} />
            <TextareaField
              name={`${prefix}.description`}
              label="What it does (shown on click)"
              maxLength={400}
              rows={2}
              wide
            />
          </>
        )}
      />
      <RepeaterField
        name={`${name}.edges`}
        label="Connections"
        description={
          nodeOptions.length
            ? "Arrows between components, e.g. Web app → Orders API (REST)."
            : "Add components first (with keys), then connect them."
        }
        max={60}
        addLabel="Add connection"
        newItem={() => ({ from: "", to: "", label: "" })}
        itemLabel={(i) => {
          const edge = flow.edges[i];
          return edge?.from && edge?.to ? `${edge.from} → ${edge.to}` : `Connection ${i + 1}`;
        }}
        render={(prefix) => (
          <>
            <SelectField
              name={`${prefix}.from`}
              label="From"
              options={nodeOptions}
              placeholder="Choose…"
            />
            <SelectField
              name={`${prefix}.to`}
              label="To"
              options={nodeOptions}
              placeholder="Choose…"
            />
            <TextField
              name={`${prefix}.label`}
              label="Label"
              placeholder="REST / events / SQL"
              wide
            />
          </>
        )}
      />
      {valid.length ? (
        <div className="flex flex-col gap-3 sm:col-span-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setPreview((v) => !v)}
          >
            {preview ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            {preview ? "Hide preview" : "Preview interactive diagram"}
          </Button>
          {preview ? (
            <InteractiveDiagram
              flow={{
                nodes: valid,
                edges: flow.edges.filter((e) => e.from && e.to),
              }}
              title="Preview"
            />
          ) : null}
        </div>
      ) : null}
    </>
  );
}
