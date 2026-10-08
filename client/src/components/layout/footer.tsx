import Link from "next/link";
import { cacheLife } from "next/cache";
import { Lock } from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";
import { SocialIcon } from "@/components/shared/social-icon";
import { StatusBadge } from "@/components/shared/status-badge";
import { footerResources, mainNav, siteConfig } from "@/config/site";

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

export async function Footer() {
  const year = await getCurrentYear();

  return (
    <footer className="mt-24 border-t">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col items-start gap-4">
          <div>
            <p className="font-medium">{siteConfig.name}</p>
            <p className="text-sm text-muted-foreground">{siteConfig.role}</p>
          </div>
          <StatusBadge label={siteConfig.availability} />
          <div className="flex items-center gap-2 font-mono text-xs">
            <a href={`mailto:${siteConfig.email}`} className={linkClass}>
              {siteConfig.email}
            </a>
            <CopyButton value={siteConfig.email} label="Copy email address" />
          </div>
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
          {siteConfig.socials.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkClass} inline-flex items-center gap-2`}
              >
                <SocialIcon name={social.icon} className="size-3.5" />
                {social.label}
              </a>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Resources">
          {footerResources.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={linkClass} prefetch={false}>
                {item.label}
              </Link>
            </li>
          ))}
        </FooterColumn>
      </div>

      <div className="border-t">
        <div className="container-page flex flex-col gap-3 py-5 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Built with Next.js · Deployed on Vercel &amp; Render · © {year} {siteConfig.name}
          </p>
          {/* Admin entry point (portfolio.md §3.2): deliberately low-key, never in the main nav. */}
          <Link
            href="/admin/login"
            rel="nofollow"
            prefetch={false}
            className={`${linkClass} inline-flex items-center gap-1.5 self-start sm:self-auto`}
          >
            <Lock className="size-3" aria-hidden="true" />
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
