import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Background } from "@/components/layout/background";
import { getSettings } from "@/lib/data/public";
import { SITE_URL } from "@/lib/seo";
import { themeScript } from "@/lib/theme-script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const defaultTitle = settings.seo.title || `${settings.name} — ${settings.role}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: defaultTitle, template: `%s — ${settings.name}` },
    description:
      settings.seo.description ||
      settings.tagline ||
      `Portfolio of ${settings.name}: projects, architecture and engineering decisions.`,
    applicationName: settings.name,
    authors: [{ name: settings.name, url: SITE_URL }],
    creator: settings.name,
    openGraph: { type: "website", siteName: settings.name, locale: "en_US" },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  // Accent colour from Site Settings (validated as #rrggbb by the API).
  const style = {
    colorScheme: "dark",
    ...(settings.accentColor ? { "--brand": settings.accentColor } : {}),
  } as CSSProperties;

  return (
    // Dark-first: server HTML defaults to dark; the inline script corrects it before paint.
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={style}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <Background />
        {children}
        {/* Only on Vercel: elsewhere the script 404s. */}
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  );
}
