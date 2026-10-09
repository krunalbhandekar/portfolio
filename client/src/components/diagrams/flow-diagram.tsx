"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { describeFlow, FLOW_KIND_LABELS, type FlowData } from "./flow-layout";

const InteractiveDiagram = dynamic(() => import("./interactive-diagram"), {
  ssr: false,
  loading: () => <Skeleton className="h-[440px] w-full rounded-xl" />,
});

/**
 * Loads React Flow only when the diagram scrolls near the viewport. The text version below
 * is always in the HTML (screen readers, search engines, no-JS).
 */
export function FlowDiagram({ flow, title }: { flow: FlowData; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <figure ref={ref} className="flex flex-col gap-2">
      <div aria-hidden={!visible || undefined}>
        {visible ? (
          <InteractiveDiagram flow={flow} title={title} />
        ) : (
          <Skeleton className="h-[440px] w-full rounded-xl" />
        )}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer font-mono text-xs text-muted-foreground hover:text-foreground">
          Diagram as text
        </summary>
        <ul className="mt-2 flex flex-col gap-1.5 text-muted-foreground">
          {describeFlow(flow).map((node) => (
            <li key={node.id}>
              <span className="font-medium text-foreground">{node.label}</span> (
              {FLOW_KIND_LABELS[node.kind] ?? node.kind})
              {node.description ? ` — ${node.description}` : ""}
              {node.outgoing.length
                ? ` → ${node.outgoing.map((o) => `${o.to}${o.label ? ` (${o.label})` : ""}`).join(", ")}`
                : ""}
            </li>
          ))}
        </ul>
      </details>
    </figure>
  );
}
