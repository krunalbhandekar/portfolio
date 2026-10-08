import type { Metadata } from "next";
import { CalendarDays, Mail, MapPin } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { CopyButton } from "@/components/shared/copy-button";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeader } from "@/components/shared/section-header";
import { SocialIcon, isSocialIcon } from "@/components/shared/social-icon";
import { StatusBadge } from "@/components/shared/status-badge";
import { getSettings } from "@/lib/data/public";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    title: "Contact",
    description: `Get in touch with ${settings.name} about roles, freelance work or collaboration.`,
    path: "/contact",
    settings,
  });
}

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <div className="container-page grid gap-12 py-16 lg:grid-cols-[1fr_1.4fr]">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <div className="flex flex-col gap-8">
        <SectionHeader
          as="h1"
          eyebrow="Contact"
          title="Let's talk"
          description="Hiring, a freelance project or just want to say hi? Send a message — I read every one."
        />
        <StatusBadge text={settings.availabilityText} />
        <ul className="flex flex-col gap-4 text-sm">
          {settings.email ? (
            <li className="flex items-center gap-3">
              <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
              <a href={`mailto:${settings.email}`} className="hover:underline">
                {settings.email}
              </a>
              <CopyButton value={settings.email} label="Copy email address" />
            </li>
          ) : null}
          {settings.location ? (
            <li className="flex items-center gap-3">
              <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />{" "}
              {settings.location}
            </li>
          ) : null}
          {settings.calendarUrl ? (
            <li className="flex items-center gap-3">
              <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
              <a
                href={settings.calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Book a call
              </a>
            </li>
          ) : null}
          {settings.socials.map((social) => (
            <li key={social.url} className="flex items-center gap-3">
              {isSocialIcon(social.platform) ? (
                <SocialIcon name={social.platform} className="size-4 text-muted-foreground" />
              ) : (
                <span className="size-4" />
              )}
              <a
                href={social.url}
                target="_blank"
                rel="noopener noreferrer me"
                className="hover:underline"
              >
                {social.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <ContactForm />
    </div>
  );
}
