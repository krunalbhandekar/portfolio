import { model, Schema } from "mongoose";
import { singletonFields, sub } from "../shared/mongoose.js";

/** Admin-editable GitHub settings (singleton). */
const githubConfigSchema = new Schema(
  {
    ...singletonFields,
    username: String,
    pinnedRepos: [String],
    showContributions: { type: Boolean, default: true },
    showLanguages: { type: Boolean, default: true },
    showPullRequests: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const GithubConfig = model("GithubConfig", githubConfigSchema, "githubConfig");

/**
 * Last successful GitHub fetch (portfolio.md §3.11). Pages read only this, so visitors never
 * hit GitHub's rate limits; a daily cron job refreshes it.
 */
const githubCacheSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    username: String,
    profile: sub({
      name: String,
      avatarUrl: String,
      htmlUrl: String,
      bio: String,
      publicRepos: Number,
      followers: Number,
    }),
    repos: [
      sub({
        name: String,
        fullName: String,
        description: String,
        htmlUrl: String,
        homepage: String,
        stars: Number,
        forks: Number,
        language: String,
        topics: [String],
        fork: Boolean,
        archived: Boolean,
        pushedAt: Date,
      }),
    ],
    languages: [sub({ name: String, bytes: Number, percent: Number, color: String })],
    contributions: sub({
      total: Number,
      weeks: [sub({ days: [sub({ date: String, count: Number, level: Number })] })],
    }),
    pullRequests: [
      sub({
        title: String,
        url: String,
        repo: String,
        repoUrl: String,
        merged: Boolean,
        createdAt: Date,
      }),
    ],
    fetchedAt: Date,
    /** Last sync error (the previous data is kept and still served). */
    error: String,
    errorAt: Date,
  },
  { versionKey: false },
);
export const GithubCache = model("GithubCache", githubCacheSchema, "githubCache");
