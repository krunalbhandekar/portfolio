import type { Metadata } from "next";
import type { Settings } from "./data/types";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  "",
);

export const absoluteUrl = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Per-page metadata with canonical URL and Open Graph/Twitter defaults (portfolio.md §8.1). */
export function pageMetadata({
  title,
  description,
  path,
  settings,
  noindex,
  ownImage,
}: {
  title?: string;
  description?: string;
  path: string;
  settings: Settings;
  noindex?: boolean;
  /** The route has its own opengraph-image file (e.g. projects); don't set a default. */
  ownImage?: boolean;
}): Metadata {
  const desc =
    description ||
    settings.seo.description ||
    settings.tagline ||
    `${settings.name} — ${settings.role}`;
  // Explicit, because a page-level `openGraph` replaces the root opengraph-image file.
  const image = settings.seo.ogImage
    ? { url: settings.seo.ogImage.url, alt: settings.seo.ogImage.alt }
    : {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${settings.name} — ${settings.role}`,
      };
  return {
    ...(title ? { title } : {}),
    description: desc,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      type: "website",
      url: absoluteUrl(path),
      siteName: settings.name,
      title: title
        ? `${title} — ${settings.name}`
        : settings.seo.title || `${settings.name} — ${settings.role}`,
      description: desc,
      ...(ownImage ? {} : { images: [image] }),
    },
    twitter: { card: "summary_large_image", ...(ownImage ? {} : { images: [image.url] }) },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export function personJsonLd(settings: Settings, skills: string[] = []) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: settings.name,
    jobTitle: settings.role,
    url: SITE_URL,
    ...(settings.email ? { email: `mailto:${settings.email}` } : {}),
    ...(settings.avatar ? { image: settings.avatar.url } : {}),
    ...(settings.location
      ? { address: { "@type": "PostalAddress", addressLocality: settings.location } }
      : {}),
    sameAs: settings.socials.filter((s) => s.url.startsWith("http")).map((s) => s.url),
    ...(skills.length ? { knowsAbout: skills } : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
