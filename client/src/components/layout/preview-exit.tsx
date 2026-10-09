"use client";

import { usePathname } from "next/navigation";

export function PreviewExit() {
  const pathname = usePathname();
  return (
    <form method="POST" action="/api/draft/disable">
      <input type="hidden" name="path" value={pathname} />
      <button
        type="submit"
        className="rounded-md border border-amber-500/40 px-2 py-0.5 font-medium hover:bg-amber-500/20"
      >
        Exit preview
      </button>
    </form>
  );
}
