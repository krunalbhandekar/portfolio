import type { GithubData } from "@/lib/data/types";

/** Stacked language bar + legend (share of code across own public repos). */
export function LanguageBar({ languages }: { languages: GithubData["languages"] }) {
  if (!languages.length) return null;
  const shown = languages.slice(0, 6);
  const other = Math.max(0, 100 - shown.reduce((sum, l) => sum + l.percent, 0));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        {shown.map((l) => (
          <span key={l.name} style={{ width: `${l.percent}%`, backgroundColor: l.color }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {shown.map((l) => (
          <li key={l.name} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: l.color }}
              aria-hidden="true"
            />
            <span className="font-medium">{l.name}</span>
            <span className="font-mono text-muted-foreground">{l.percent}%</span>
          </li>
        ))}
        {other >= 0.5 ? (
          <li className="flex items-center gap-1.5 text-muted-foreground">
            Other <span className="font-mono">{Math.round(other * 10) / 10}%</span>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
