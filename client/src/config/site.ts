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

/**
 * Only pages that exist. Everything else is one ⌘K away. The order is also the "tour" order:
 * the Next-up teaser at the bottom of each page leads to the following item, and `teaser` is
 * the hook shown for it (explore progress, home "Explore" grid).
 */
export const mainNav = [
  {
    label: "Projects",
    href: "/projects",
    teaser: "Production systems and side projects: the problem, the build and what shipped.",
  },
  {
    label: "Case Studies",
    href: "/case-studies",
    teaser: "Deep dives into hard calls: constraints, trade-offs and what happened next.",
  },
  {
    label: "Engineering",
    href: "/engineering",
    teaser: "APIs, architecture diagrams and the engineering behind the products.",
  },
  {
    label: "Blog",
    href: "/blog",
    teaser: "Notes on what I learned building things, the things that broke included.",
  },
  {
    label: "Experience",
    href: "/experience",
    teaser: "Every role on the timeline, with what I owned and the impact it had.",
  },
  {
    label: "About",
    href: "/about",
    teaser: "The person behind the commits: story, values and how I like to work.",
  },
  {
    label: "Contact",
    href: "/contact",
    teaser: "Have a role or a project in mind? This is the shortest path to me.",
  },
] as const;

export type NavItem = (typeof mainNav)[number];

export const footerResources = [
  { label: "Resume", href: "/resume" },
  { label: "Skills", href: "/skills" },
  { label: "What I Built", href: "/built" },
  { label: "Hire me", href: "/hire" },
  { label: "RSS", href: "/rss.xml" },
  { label: "Sitemap", href: "/sitemap.xml" },
] as const;
