import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getSettings } from "@/lib/data/public";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  const { announcement } = settings;

  return (
    <>
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
    </>
  );
}
