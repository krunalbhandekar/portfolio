import { z } from "zod";

export const githubInput = z.object({
  /** GitHub login, e.g. "krunalbhandekar". Empty hides the GitHub section. */
  username: z
    .string()
    .trim()
    .max(39)
    .regex(/^$|^[a-z\d](?:[a-z\d]|-(?=[a-z\d]))*$/i, "Not a valid GitHub username")
    .default(""),
  /** Repo names in display order; empty = most-starred own repos. */
  pinnedRepos: z.array(z.string().trim().min(1).max(100)).max(6).default([]),
  showContributions: z.boolean().default(true),
  showLanguages: z.boolean().default(true),
  showPullRequests: z.boolean().default(true),
});
