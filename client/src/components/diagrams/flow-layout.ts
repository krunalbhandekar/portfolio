export type FlowKind =
  "client" | "frontend" | "service" | "database" | "cache" | "queue" | "external" | "infra";

export type FlowData = {
  nodes: { id: string; label: string; kind: FlowKind; description: string }[];
  edges: { from: string; to: string; label: string }[];
};

export const FLOW_KIND_LABELS: Record<FlowKind, string> = {
  client: "Client",
  frontend: "Frontend",
  service: "Service",
  database: "Database",
  cache: "Cache",
  queue: "Queue",
  external: "External service",
  infra: "Infrastructure",
};

const COLUMN = 240;
const ROW = 110;

/**
 * Left-to-right layered layout without a layout library: each node's column is the longest
 * path leading to it (cycles are capped), rows are centred within the column.
 */
export function layoutFlow(flow: FlowData) {
  const ids = new Set(flow.nodes.map((n) => n.id));
  const edges = flow.edges.filter((e) => ids.has(e.from) && ids.has(e.to) && e.from !== e.to);
  const rank = new Map(flow.nodes.map((n) => [n.id, 0]));
  const max = flow.nodes.length - 1;
  for (let pass = 0; pass < flow.nodes.length; pass++) {
    let changed = false;
    for (const e of edges) {
      const next = Math.min(rank.get(e.from)! + 1, max);
      if (next > rank.get(e.to)!) {
        rank.set(e.to, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const columns = new Map<number, string[]>();
  for (const node of flow.nodes) {
    const r = rank.get(node.id)!;
    columns.set(r, [...(columns.get(r) ?? []), node.id]);
  }
  const position = new Map<string, { x: number; y: number }>();
  for (const [r, column] of columns) {
    column.forEach((id, i) => {
      position.set(id, { x: r * COLUMN, y: (i - (column.length - 1) / 2) * ROW });
    });
  }
  return { position, edges };
}

/** Plain-text description (screen readers, search engines, no-JS). */
export function describeFlow(flow: FlowData) {
  const label = new Map(flow.nodes.map((n) => [n.id, n.label]));
  return flow.nodes.map((node) => ({
    ...node,
    outgoing: flow.edges
      .filter((e) => e.from === node.id && label.has(e.to))
      .map((e) => ({ to: label.get(e.to)!, label: e.label })),
  }));
}
