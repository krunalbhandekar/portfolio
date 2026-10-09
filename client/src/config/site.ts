/**
 * Layout chrome configuration.
 *
 * Fallback values only: the live name, role, socials, email and availability text come from Site
 * Settings in the admin (`getSettings()`); these are used if the API is unreachable.
 * Navigation links stay here.
 */
export const siteConfig = {
  name: "Krunal Bhandekar",
  shortName: "KB",
  role: "Full-Stack Software Engineer",
  email: "krunalbhandekar10@gmail.com",
  availability: "Available for opportunities",
  location: "Pune, India",
  socials: [
    { label: "GitHub", href: "https://github.com/krunalbhandekar", icon: "github" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/krunal-bhandekar", icon: "linkedin" },
  ],
} as const;

/** Only pages that exist. Blog joins in Phase 6. */
export const mainNav = [
  { label: "Projects", href: "/projects" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Engineering", href: "/engineering" },
  { label: "Experience", href: "/experience" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerResources = [
  { label: "Resume", href: "/resume" },
  { label: "Skills", href: "/skills" },
  { label: "What I Built", href: "/built" },
  { label: "Sitemap", href: "/sitemap.xml" },
] as const;
