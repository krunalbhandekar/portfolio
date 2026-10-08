"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Renders Mermaid source client-side. The (large) mermaid library is only downloaded when a
 * diagram scrolls near the viewport, so pages without diagrams pay nothing.
 */
export function MermaidDiagram({ source, title }: { source: string; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        try {
          const mermaid = (await import("mermaid")).default;
          const dark = document.documentElement.classList.contains("dark");
          mermaid.initialize({
            startOnLoad: false,
            theme: dark ? "dark" : "neutral",
            securityLevel: "strict",
          });
          const { svg: rendered } = await mermaid.render(`mermaid-${id}`, source);
          if (!cancelled) setSvg(rendered);
        } catch {
          if (!cancelled) setFailed(true);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [id, source]);

  return (
    <figure className="overflow-x-auto rounded-2xl border bg-surface p-4">
      <div
        ref={ref}
        role="img"
        aria-label={`${title} architecture diagram`}
        className="flex min-h-40 justify-center [&_svg]:max-w-full"
      >
        {svg ? (
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        ) : failed ? (
          <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{source}</pre>
        ) : (
          <span className="self-center font-mono text-xs text-muted-foreground">
            Loading diagram…
          </span>
        )}
      </div>
    </figure>
  );
}
