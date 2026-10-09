"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Briefcase,
  CornerDownLeft,
  Cpu,
  FileText,
  FolderKanban,
  Mail,
  NotebookPen,
  Search,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Kbd } from "@/components/shared/kbd";
import { isPaletteShortcut, OPEN_PALETTE_EVENT } from "@/lib/command-palette-events";
import type { SearchItem } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/** Public pages (never /admin). */
const PAGES: SearchItem[] = [
  ["Home", "/"],
  ["Projects", "/projects"],
  ["Case Studies", "/case-studies"],
  ["Blog", "/blog"],
  ["Engineering", "/engineering"],
  ["What I Built", "/built"],
  ["Experience", "/experience"],
  ["Skills", "/skills"],
  ["About", "/about"],
  ["Resume", "/resume"],
  ["Hire me — recruiter quick view", "/hire"],
  ["Contact", "/contact"],
].map(([title, href]) => ({
  type: "page",
  title: title!,
  subtitle: "Page",
  href: href!,
  keywords: "",
}));

const GROUPS: { type: SearchItem["type"]; label: string; icon: LucideIcon }[] = [
  { type: "page", label: "Pages", icon: FileText },
  { type: "project", label: "Projects", icon: FolderKanban },
  { type: "case-study", label: "Case studies", icon: BookOpen },
  { type: "post", label: "Blog posts", icon: NotebookPen },
  { type: "skill", label: "Skills", icon: Cpu },
  { type: "engineering", label: "Engineering", icon: Wrench },
];

function score(item: SearchItem, words: string[]) {
  if (!words.length) return 1;
  const title = item.title.toLowerCase();
  const rest = `${item.subtitle} ${item.keywords}`.toLowerCase();
  let total = 0;
  for (const word of words) {
    if (title.startsWith(word)) total += 6;
    else if (title.split(/\W+/).some((part) => part.startsWith(word))) total += 4;
    else if (title.includes(word)) total += 3;
    else if (rest.includes(word)) total += 1;
    else return 0; // every word must match somewhere
  }
  return total;
}

/**
 * ⌘K / Ctrl+K command palette (portfolio.md §4 #1): jump to any page, project, case study,
 * post, skill or engineering entry. Native <dialog> for focus trapping and Esc; ARIA combobox
 * + listbox for screen readers; fully keyboard operable.
 */
export default function CommandPalette({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [index, setIndex] = useState<SearchItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    if (index || failed) return;
    fetch("/api/search-index")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((items: SearchItem[]) => setIndex(items))
      .catch(() => setFailed(true));
  }, [index, failed]);

  const show = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActive(0);
    load();
  }, [load]);

  // The index loads on first open (state is set later, in the fetch callback).
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // Open with ⌘K / Ctrl+K, "/" (outside text fields) or the navbar trigger.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isPaletteShortcut(e)) return;
      if (e.key === "/" && dialogRef.current?.open) return; // typing "/" in the search box
      e.preventDefault();
      if (dialogRef.current?.open) setOpen(false);
      else show();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, show);
    };
  }, [show]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const all = [...PAGES, ...(index ?? [])];
    const matched = all
      .map((item) => ({ item, score: score(item, words) }))
      .filter((r) => r.score > 0);
    // Without a query: pages + a few of each type; with one: best matches per group.
    const grouped = GROUPS.map((group) => ({
      ...group,
      items: matched
        .filter((r) => r.item.type === group.type)
        .sort((a, b) => b.score - a.score)
        .slice(0, words.length ? 6 : group.type === "page" ? 13 : 3)
        .map((r) => r.item),
    })).filter((g) => g.items.length);
    // Position of each option in the flat (keyboard) order.
    return grouped.map((group, gi) => {
      const start = grouped.slice(0, gi).reduce((sum, g) => sum + g.items.length, 0);
      return { ...group, items: group.items.map((item, i) => ({ item, n: start + i })) };
    });
  }, [query, index]);
  const flat = useMemo(() => results.flatMap((g) => g.items.map((x) => x.item)), [results]);
  const current = Math.min(active, Math.max(flat.length - 1, 0));

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${current}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [current]);

  function go(item: SearchItem | undefined) {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((current + 1) % Math.max(flat.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((current - 1 + flat.length) % Math.max(flat.length, 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(flat.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(flat[current]);
    }
  }

  const listId = `${id}-list`;
  const optionId = (i: number) => `${id}-option-${i}`;

  return (
    <dialog
      ref={dialogRef}
      aria-label="Search the site"
      onClose={() => setOpen(false)}
      onClick={(e) => {
        if (e.target === dialogRef.current) setOpen(false); // backdrop click
      }}
      className="m-auto mt-[12vh] w-[min(640px,calc(100vw-2rem))] overflow-hidden rounded-2xl border bg-popover p-0 text-popover-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 border-b px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={flat.length ? optionId(current) : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search projects, posts, skills…"
          className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          spellCheck={false}
          autoComplete="off"
        />
        <Kbd className="hidden sm:inline-flex">Esc</Kbd>
      </div>

      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="Results"
        className="max-h-[min(60vh,440px)] overflow-y-auto p-2"
      >
        {results.map((group) => (
          <li key={group.type} role="presentation">
            <p
              role="presentation"
              className="px-3 pt-3 pb-1.5 font-mono text-[0.65rem] tracking-widest text-muted-foreground uppercase"
            >
              {group.label}
            </p>
            <ul role="group" aria-label={group.label}>
              {group.items.map(({ item, n }) => {
                const selected = n === current;
                const Icon = group.icon;
                return (
                  <li
                    key={`${item.type}-${item.href}`}
                    id={optionId(n)}
                    role="option"
                    aria-selected={selected}
                    data-index={n}
                    onMouseMove={() => setActive(n)}
                    onClick={() => go(item)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5",
                      selected ? "bg-accent text-accent-foreground" : "text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{item.title}</span>
                      {item.type !== "page" && item.subtitle ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {item.subtitle}
                        </span>
                      ) : null}
                    </span>
                    {selected ? (
                      <CornerDownLeft
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
        {!flat.length ? (
          <li role="presentation" className="px-3 py-10 text-center text-sm text-muted-foreground">
            {index || failed ? (
              <>
                No results for “{query}”.{" "}
                <a href="/contact" className="text-brand-text hover:underline">
                  <Mail className="inline size-3.5" aria-hidden="true" /> Ask me
                </a>
              </>
            ) : (
              "Loading…"
            )}
          </li>
        ) : null}
      </ul>

      <div className="flex items-center gap-4 border-t px-4 py-2.5 font-mono text-[0.65rem] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> navigate
        </span>
        <span className="flex items-center gap-1">
          <Kbd>↵</Kbd> open
        </span>
        <span className="ml-auto flex items-center gap-1">
          <Briefcase className="size-3" aria-hidden="true" /> {flat.length} results
        </span>
      </div>
      <p className="sr-only" aria-live="polite">
        {open ? `${flat.length} results` : ""}
      </p>
    </dialog>
  );
}
