/** Bookkeeping fields that change on every save and aren't content. */
const IGNORED = new Set(["_id", "__v", "createdAt", "updatedAt", "updatedBy", "key", "order"]);

type Flat = Map<string, unknown>;

/** `{a: {b: [1]}}` → `a.b.0 = 1` (media refs collapse to their URL). */
function flatten(value: unknown, prefix = "", out: Flat = new Map()): Flat {
  if (Array.isArray(value)) {
    if (!value.length) out.set(prefix, "");
    value.forEach((item, i) => flatten(item, prefix ? `${prefix}.${i}` : String(i), out));
  } else if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("mediaId" in record && "url" in record) {
      out.set(prefix, String(record.url ?? ""));
      return out;
    }
    for (const [key, child] of Object.entries(record)) {
      if (!prefix && IGNORED.has(key)) continue;
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
  } else {
    out.set(prefix, value ?? "");
  }
  return out;
}

const normalize = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export type FieldChange = { path: string; before: string; after: string };

/** Fields that differ between a revision snapshot and the current document. */
export function diffDocuments(before: unknown, after: unknown): FieldChange[] {
  const a = flatten(before);
  const b = flatten(after);
  const paths = [...new Set([...a.keys(), ...b.keys()])].sort();
  return paths
    .map((path) => ({ path, before: normalize(a.get(path)), after: normalize(b.get(path)) }))
    .filter((c) => c.before !== c.after);
}

/** Rich text → readable text for comparison. */
export const plain = (value: string) =>
  value
    .replace(/<(br|\/p|\/li|\/h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

export type WordPart = { text: string; type: "same" | "added" | "removed" };

/** Word-level diff (LCS). Falls back to whole before/after for very long texts. */
export function diffWords(before: string, after: string): WordPart[] | null {
  const a = before.split(/(\s+)/).filter(Boolean);
  const b = after.split(/(\s+)/).filter(Boolean);
  if (a.length * b.length > 400_000) return null;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i]![j] = a[i] === b[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
  const parts: WordPart[] = [];
  const push = (text: string, type: WordPart["type"]) => {
    const last = parts.at(-1);
    if (last?.type === type) last.text += text;
    else parts.push({ text, type });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push(a[i]!, "same");
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) push(a[i++]!, "removed");
    else push(b[j++]!, "added");
  }
  while (i < a.length) push(a[i++]!, "removed");
  while (j < b.length) push(b[j++]!, "added");
  return parts;
}

/** "sections.2.content" → "Sections › 3 › Content". */
export const prettyPath = (path: string) =>
  path
    .split(".")
    .map((part) =>
      /^\d+$/.test(part)
        ? String(Number(part) + 1)
        : part.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
    )
    .join(" › ");
