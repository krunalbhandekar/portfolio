/**
 * Seeds the database with the admin account and starter content (portfolio.md §15, Phase 3).
 * Idempotent: only creates what is missing, never overwrites existing documents.
 *
 *   npm run seed
 */
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { About } from "../src/modules/about/about.model.js";
import { Admin } from "../src/modules/admins/admin.model.js";
import { Homepage } from "../src/modules/homepage/homepage.model.js";
import { HOMEPAGE_SECTIONS } from "../src/modules/homepage/homepage.schema.js";
import { SiteSettings } from "../src/modules/settings/settings.model.js";
import { Skill } from "../src/modules/skills/skill.model.js";

const created: string[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- works with any model
async function ensure(label: string, model: mongoose.Model<any>, filter: object, doc: object) {
  if (await model.exists(filter)) return;
  await model.create(doc);
  created.push(label);
}

const starterSkills: [name: string, slug: string, category: string][] = [
  ["React", "react", "frontend"],
  ["Next.js", "nextjs", "frontend"],
  ["TypeScript", "typescript", "frontend"],
  ["JavaScript", "javascript", "frontend"],
  ["Tailwind CSS", "tailwind-css", "frontend"],
  ["Redux", "redux", "frontend"],
  ["React Query", "react-query", "frontend"],
  ["Node.js", "node-js", "backend"],
  ["Express", "express", "backend"],
  ["MongoDB", "mongodb", "database"],
  ["MySQL", "mysql", "database"],
  ["Redis", "redis", "database"],
  ["Docker", "docker", "devops"],
  ["Kubernetes", "kubernetes", "devops"],
  ["Jenkins", "jenkins", "devops"],
  ["AWS", "aws", "cloud"],
  ["Git", "git", "tools"],
  ["Postman", "postman", "tools"],
];

await connectDatabase();

await ensure(
  "admin",
  Admin,
  { email: env.ADMIN_EMAIL },
  { email: env.ADMIN_EMAIL, name: "Krunal Bhandekar" },
);

await ensure(
  "site settings",
  SiteSettings,
  { key: "default" },
  {
    key: "default",
    name: "Krunal Bhandekar",
    role: "Full-Stack Software Engineer",
    tagline:
      "Here is my engineering journey: the systems I've built, the problems I've solved, the decisions I've made, and the impact of my work.",
    location: "Pune, India",
    email: "krunalbhandekar10@gmail.com",
    availabilityText: "Available for opportunities",
    accentColor: "#34d399",
    socials: [
      { platform: "github", label: "GitHub", url: "https://github.com/krunalbhandekar" },
      {
        platform: "linkedin",
        label: "LinkedIn",
        url: "https://www.linkedin.com/in/krunal-bhandekar",
      },
    ],
    announcement: { enabled: false, text: "", href: "" },
    seo: {
      title: "Krunal Bhandekar — Full-Stack Software Engineer",
      description:
        "Projects, case studies, architecture and engineering decisions from a full-stack engineer.",
    },
  },
);

await ensure(
  "homepage",
  Homepage,
  { key: "default" },
  {
    key: "default",
    hero: {
      eyebrow: "$ whoami",
      headline: "Krunal Bhandekar",
      subheadline: "Full-Stack Software Engineer",
      positioning:
        "My engineering journey: the systems I've built, the problems I've solved, the decisions I've made, and the impact of my work.",
      stack: ["react", "node-js", "typescript", "mongodb"],
    },
    ctas: [
      { label: "View Projects", href: "/projects", variant: "primary" },
      { label: "Download Resume", href: "/resume", variant: "outline" },
      { label: "Contact Me", href: "/contact", variant: "ghost" },
    ],
    sections: HOMEPAGE_SECTIONS.map((key) => ({ key, visible: true })),
  },
);

await ensure("about", About, { key: "default" }, { key: "default", headline: "", story: "" });

if ((await Skill.estimatedDocumentCount()) === 0) {
  await Skill.insertMany(
    starterSkills.map(([name, slug, category], order) => ({
      name,
      slug,
      category,
      icon: slug,
      status: "published",
      order,
    })),
  );
  created.push(`${starterSkills.length} starter skills`);
}

console.log(
  created.length ? `Seeded: ${created.join(", ")}` : "Nothing to seed — everything already exists.",
);
await disconnectDatabase();
