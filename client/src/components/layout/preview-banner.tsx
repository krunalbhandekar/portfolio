import { draftMode } from "next/headers";
import { PreviewExit } from "./preview-exit";

/**
 * Shown only in Draft Mode. Reading `draftMode()` inside `use cache` is supported: normal
 * visitors get the cached (empty) result; previews re-execute it.
 */
export async function PreviewBanner() {
  "use cache";
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-center gap-3 border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs print:hidden"
    >
      <span className="font-medium">Draft preview</span>
      <span className="text-muted-foreground">Unpublished changes are visible only to you.</span>
      <PreviewExit />
    </div>
  );
}
