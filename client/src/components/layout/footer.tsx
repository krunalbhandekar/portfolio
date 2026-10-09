import Link from "next/link";
import { cacheLife } from "next/cache";
import { Contact } from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";
import { SocialIcon, isSocialIcon } from "@/components/shared/social-icon";
import { StatusBadge } from "@/components/shared/status-badge";
import { footerResources, mainNav } from "@/config/site";
import type { Settings } from "@/lib/data/types";
import { AdminLink } from "./admin-link";

async function getCurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">{title}</h2>
      <ul className="flex flex-col gap-2 text-sm">{children}</ul>
    </div>
  );
}

const linkClass = "text-muted-foreground transition-colors hover:text-foreground";

export async function Footer({ settings }: { settings: Settings }) {
  const year = await getCurrentYear();

  return (
    <footer className="mt-24 border-t print:hidden">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col items-start gap-4">
          <div>
            <p className="font-medium">{settings.name}</p>
            <p className="text-sm text-muted-foreground">{settings.role}</p>
          </div>
          <StatusBadge text={settings.availabilityText} />
          {settings.email ? (
            <div className="flex items-center gap-2 font-mono text-xs">
              <a href={`mailto:${settings.email}`} className={linkClass}>
                {settings.email}
              </a>
              <CopyButton value={settings.email} label="Copy email address" toast="Email copied" />
            </div>
          ) : null}
        </div>

        <FooterColumn title="Navigate">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={linkClass}>
                {item.label}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Connect">
          {settings.socials.map((social) => (
            <li key={social.url}>
              <a
                href={social.url}
                target="_blank"
                rel="noopener noreferrer me"
                className={`${linkClass} inline-flex items-center gap-2`}
              >
                {isSocialIcon(social.platform) ? (
                  <SocialIcon name={social.platform} className="size-3.5" />
                ) : null}
                {social.label}
              </a>
            </li>
          ))}
          <li>
            <a href="/vcard.vcf" download className={`${linkClass} inline-flex items-center gap-2`}>
              <Contact className="size-3.5" aria-hidden="true" /> Save contact
            </a>
          </li>
        </FooterColumn>

        <FooterColumn title="Resources">
          {footerResources.map((item) => (
            <li key={item.href}>
              {/* Feeds/files are route handlers, not pages: plain links (full load). */}
              {/\.(xml|vcf)$/.test(item.href) ? (
                <a href={item.href} className={linkClass}>
                  {item.label}
                </a>
              ) : (
                <Link href={item.href} className={linkClass} prefetch={false}>
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </FooterColumn>
      </div>

      <div className="border-t">
        <div className="container-page flex flex-col gap-3 py-5 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Built with Next.js · Deployed on Vercel &amp; Render · © {year} {settings.name}
          </p>
          {/* Admin entry point (portfolio.md §3.2): deliberately low-key, never in the main nav. */}
          <AdminLink className={`${linkClass} self-start sm:self-auto`} />
        </div>
      </div>
    </footer>
  );
}
