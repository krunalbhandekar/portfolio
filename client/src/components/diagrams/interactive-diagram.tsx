"use client";

import "@xyflow/react/dist/style.css";
import { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  Boxes,
  Cloud,
  Database,
  Globe,
  Layers,
  Monitor,
  Server,
  Workflow,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FLOW_KIND_LABELS, layoutFlow, type FlowData, type FlowKind } from "./flow-layout";

const KIND_ICONS: Record<FlowKind, LucideIcon> = {
  client: Monitor,
  frontend: Layers,
  service: Server,
  database: Database,
  cache: Zap,
  queue: Workflow,
  external: Globe,
  infra: Cloud,
};

type DiagramNode = Node<{ label: string; kind: FlowKind; description: string }, "system">;

function SystemNode({ data, selected }: NodeProps<DiagramNode>) {
  const Icon = KIND_ICONS[data.kind] ?? Boxes;
  return (
    <div
      className={cn(
        "flex w-44 items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 text-card-foreground shadow-sm transition-colors",
        selected ? "border-brand ring-2 ring-brand/30" : "hover:border-foreground/30",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-1.5 !border-0 !bg-muted-foreground/50"
      />
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand-text">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{data.label}</span>
        <span className="truncate font-mono text-[0.6rem] text-muted-foreground uppercase">
          {FLOW_KIND_LABELS[data.kind] ?? data.kind}
        </span>
      </span>
      <Handle
        type="source"
        position={Position.Right}
        className="!size-1.5 !border-0 !bg-muted-foreground/50"
      />
    </div>
  );
}

const nodeTypes = { system: SystemNode };

/** The site toggles dark mode with a class on <html>; mirror it for React Flow's own UI. */
function useColorMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark ? "dark" : "light";
}

/**
 * Zoomable, pannable architecture diagram (portfolio.md §3.8): click or press Enter on a node
 * to see what it does and how it connects. Page scrolling is never hijacked (zoom with the
 * controls or pinch).
 */
export default function InteractiveDiagram({ flow, title }: { flow: FlowData; title: string }) {
  const colorMode = useColorMode();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { nodes, edges } = useMemo(() => {
    const { position, edges } = layoutFlow(flow);
    return {
      nodes: flow.nodes.map<DiagramNode>((n) => ({
        id: n.id,
        type: "system",
        position: position.get(n.id) ?? { x: 0, y: 0 },
        data: { label: n.label, kind: n.kind, description: n.description },
        ariaLabel: `${n.label} (${FLOW_KIND_LABELS[n.kind] ?? n.kind}). Press Enter for details.`,
      })),
      edges: edges.map<Edge>((e, i) => ({
        id: `${e.from}-${e.to}-${i}`,
        source: e.from,
        target: e.to,
        label: e.label || undefined,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        labelBgPadding: [6, 3],
        labelBgBorderRadius: 4,
        className: "[&_.react-flow__edge-text]:font-mono [&_.react-flow__edge-text]:text-[10px]",
      })),
    };
  }, [flow]);

  const selected = flow.nodes.find((n) => n.id === selectedId) ?? null;
  const labelOf = (id: string) => flow.nodes.find((n) => n.id === id)?.label ?? id;

  return (
    <div className="relative h-[440px] overflow-hidden rounded-xl border bg-surface">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode={colorMode}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        nodesDraggable
        nodesConnectable={false}
        edgesFocusable={false}
        zoomOnScroll={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
        ariaLabelConfig={{ "node.a11yDescription.default": "Press Enter to see details." }}
        onNodeClick={(_, node) => setSelectedId(node.id)}
        onSelectionChange={({ nodes: picked }) => {
          if (picked[0]) setSelectedId(picked[0].id);
        }}
        onPaneClick={() => setSelectedId(null)}
        aria-label={`${title}: interactive architecture diagram`}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} position="top-right" />
      </ReactFlow>

      {selected ? (
        <aside
          aria-live="polite"
          className="absolute right-3 bottom-3 left-3 z-10 max-h-[60%] overflow-y-auto rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg sm:left-auto sm:w-80"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.65rem] text-brand-text uppercase">
                {FLOW_KIND_LABELS[selected.kind] ?? selected.kind}
              </p>
              <h4 className="font-semibold">{selected.label}</h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label="Close details"
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          {selected.description ? (
            <p className="mt-2 text-sm text-muted-foreground">{selected.description}</p>
          ) : null}
          {(() => {
            const out = flow.edges.filter((e) => e.from === selected.id);
            const incoming = flow.edges.filter((e) => e.to === selected.id);
            return out.length || incoming.length ? (
              <ul className="mt-3 flex flex-col gap-1 border-t pt-3 text-xs text-muted-foreground">
                {incoming.map((e, i) => (
                  <li key={`in-${i}`}>
                    ← from <span className="text-foreground">{labelOf(e.from)}</span>
                    {e.label ? ` (${e.label})` : ""}
                  </li>
                ))}
                {out.map((e, i) => (
                  <li key={`out-${i}`}>
                    → to <span className="text-foreground">{labelOf(e.to)}</span>
                    {e.label ? ` (${e.label})` : ""}
                  </li>
                ))}
              </ul>
            ) : null;
          })()}
        </aside>
      ) : (
        <p className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-background/80 px-2 py-1 font-mono text-[0.65rem] text-muted-foreground">
          Click a component for details · drag to pan
        </p>
      )}
    </div>
  );
}
