/**
 * Layout chrome configuration.
 *
 * Phase 1 placeholder values: from Phase 4 the name, socials, email and availability
 * come from the `siteSettings` API (portfolio.md §5.2). Navigation links stay here.
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

export const mainNav = [
  { label: "Projects", href: "/projects" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Engineering", href: "/engineering" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerResources = [
  { label: "Resume", href: "/resume" },
  { label: "Now", href: "/now" },
  { label: "Uses", href: "/uses" },
  { label: "RSS", href: "/rss.xml" },
] as const;
