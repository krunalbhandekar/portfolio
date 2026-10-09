import { getSettings } from "@/lib/data/public";
import { absoluteUrl } from "@/lib/seo";

/** vCard 3.0 text escaping. */
const esc = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/[,;]/g, "\\$&").replace(/\n/g, "\\n");

/** "Save contact" card (portfolio.md §4 #18), built from Site Settings. */
export async function GET() {
  const s = await getSettings();
  const [first, ...rest] = s.name.trim().split(/\s+/);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(rest.join(" "))};${esc(first ?? "")};;;`,
    `FN:${esc(s.name)}`,
    s.role ? `TITLE:${esc(s.role)}` : null,
    s.email ? `EMAIL;TYPE=INTERNET,PREF:${s.email}` : null,
    s.phone ? `TEL;TYPE=CELL:${s.phone.replace(/[^\d+]/g, "")}` : null,
    s.location ? `ADR;TYPE=WORK:;;;${esc(s.location)};;;` : null,
    `URL:${absoluteUrl("/")}`,
    ...s.socials
      .filter((social) => social.url.startsWith("http"))
      .map((social) => `X-SOCIALPROFILE;TYPE=${esc(social.platform)}:${social.url}`),
    s.avatar ? `PHOTO;VALUE=URI:${s.avatar.url}` : null,
    `NOTE:${esc(s.tagline || `${s.role} — ${absoluteUrl("/")}`)}`,
    "END:VCARD",
  ].filter(Boolean);
  const filename =
    s.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "contact";
  return new Response(`${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.vcf"`,
    },
  });
}
