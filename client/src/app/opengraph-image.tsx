import { getSettings } from "@/lib/data/public";
import { OG_SIZE, renderOgImage } from "@/lib/og";
import { SITE_URL } from "@/lib/seo";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Portfolio share card";

export default async function OpengraphImage() {
  const settings = await getSettings();
  return renderOgImage({
    eyebrow: "Portfolio",
    title: settings.name,
    subtitle: settings.role,
    footer: SITE_URL.replace(/^https?:\/\//, ""),
    accent: settings.accentColor || "#34d399",
  });
}
