import { Lock } from "lucide-react";
import { CodeBlock } from "@/components/shared/code-block";
import { RichText } from "@/components/shared/rich-text";
import type { EngineeringItem } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  POST: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  PUT: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  PATCH: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  DELETE: "bg-red-500/15 text-red-700 dark:text-red-300",
};
const AUTH_LABELS: Record<string, string> = {
  none: "Public",
  user: "User session",
  admin: "Admin only",
  "api-key": "API key",
};

const pretty = (text: string) => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

/** One endpoint in the API showcase (portfolio.md §3.8). */
export async function ApiCard({ item }: { item: EngineeringItem }) {
  const { api } = item;
  return (
    <article
      id={item.slug}
      className="flex scroll-mt-24 flex-col gap-4 rounded-2xl border bg-card p-6"
    >
      <header className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">{item.title}</h3>
        {api.path ? (
          <p className="flex flex-wrap items-center gap-2 font-mono text-sm">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-semibold",
                METHOD_STYLES[api.method] ?? "bg-muted",
              )}
            >
              {api.method}
            </span>
            <span className="break-all">{api.path}</span>
            <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.7rem] text-muted-foreground">
              {api.auth !== "none" ? <Lock className="size-3" aria-hidden="true" /> : null}
              {AUTH_LABELS[api.auth] ?? api.auth}
            </span>
          </p>
        ) : null}
        {item.summary ? <p className="text-sm text-muted-foreground">{item.summary}</p> : null}
      </header>
      <RichText html={item.content} className="text-sm" />
      {api.params.length ? (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[480px] text-sm">
            <caption className="sr-only">Parameters for {item.title}</caption>
            <thead>
              <tr className="border-b bg-surface text-left font-mono text-xs text-muted-foreground">
                <th className="px-3 py-2 font-normal">Name</th>
                <th className="px-3 py-2 font-normal">In</th>
                <th className="px-3 py-2 font-normal">Type</th>
                <th className="px-3 py-2 font-normal">Description</th>
              </tr>
            </thead>
            <tbody>
              {api.params.map((p) => (
                <tr key={`${p.location}-${p.name}`} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">
                    {p.name}
                    {p.required ? (
                      <span className="text-red-700 dark:text-red-400" title="Required">
                        {" "}
                        *
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{p.location}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{p.type}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {api.requestExample ? (
          <CodeBlock code={pretty(api.requestExample)} lang="json" filename="Request" />
        ) : null}
        {api.responseExample ? (
          <CodeBlock code={pretty(api.responseExample)} lang="json" filename="Response" />
        ) : null}
      </div>
      {api.statusCodes.length ? (
        <ul className="flex flex-wrap gap-2" aria-label="Status codes">
          {api.statusCodes.map((s) => (
            <li key={s.code} className="rounded-md border bg-surface px-2 py-1 font-mono text-xs">
              <span
                className={
                  s.code.startsWith("2")
                    ? "text-emerald-700 dark:text-emerald-400"
                    : s.code.startsWith("4") || s.code.startsWith("5")
                      ? "text-red-700 dark:text-red-400"
                      : ""
                }
              >
                {s.code}
              </span>
              {s.description ? (
                <span className="text-muted-foreground"> {s.description}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
