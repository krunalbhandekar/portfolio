import { Suspense } from "react";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { CommandPaletteLoader } from "@/components/layout/command-palette-loader";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PreviewBanner } from "@/components/layout/preview-banner";
import { PageViewTracker } from "@/components/layout/track-view";
import { getSettings, getVisiblePages } from "@/lib/data/public";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const [settings, visiblePages] = await Promise.all([getSettings(), getVisiblePages()]);
  const { announcement } = settings;

  return (
    <>
      <PreviewBanner />
      <AnnouncementBanner announcement={announcement} />
      <div className="print:hidden">
        <Navbar name={settings.name} logo={settings.logo} />
      </div>
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer settings={settings} visiblePages={visiblePages} />
      <CommandPaletteLoader />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
