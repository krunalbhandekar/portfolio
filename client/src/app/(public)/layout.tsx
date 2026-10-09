import { Suspense } from "react";
import Link from "next/link";
import { CommandPaletteLoader } from "@/components/layout/command-palette-loader";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PreviewBanner } from "@/components/layout/preview-banner";
import { PageViewTracker } from "@/components/layout/track-view";
import { getSettings } from "@/lib/data/public";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  const { announcement } = settings;

  return (
    <>
      <PreviewBanner />
      {announcement.enabled && announcement.text ? (
        <div className="border-b bg-surface px-4 py-2 text-center text-xs text-muted-foreground print:hidden">
          {announcement.href ? (
            <Link href={announcement.href} className="hover:text-foreground">
              {announcement.text} →
            </Link>
          ) : (
            announcement.text
          )}
        </div>
      ) : null}
      <div className="print:hidden">
        <Navbar name={settings.name} logo={settings.logo} />
      </div>
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer settings={settings} />
      <CommandPaletteLoader />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
