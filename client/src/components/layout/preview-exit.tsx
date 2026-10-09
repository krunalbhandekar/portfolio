"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

function ExitButton({ path }: { path: string }) {
  return (
    <form method="POST" action="/api/draft/disable">
      <input type="hidden" name="path" value={path} />
      <button
        type="submit"
        className="rounded-md border border-amber-500/40 px-2 py-0.5 font-medium hover:bg-amber-500/20"
      >
        Exit preview
      </button>
    </form>
  );
}

function ExitForm() {
  return <ExitButton path={usePathname()} />;
}

/** The current path is request data, so it's read inside Suspense (fallback: home page). */
export function PreviewExit() {
  return (
    <Suspense fallback={<ExitButton path="/" />}>
      <ExitForm />
    </Suspense>
  );
}
