import { ViewTransition } from "react";

/**
 * Route transition for public pages: the old page fades out quickly and the new one fades up
 * (globals.css, `.page-exit` / `.page-enter`). A template remounts on every navigation, so
 * enter/exit fire here (a layout would persist). `default="none"` keeps Suspense reveals and
 * the project card → detail morph from also crossfading the whole page.
 */
export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div className="flex flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}
