import { Router } from "express";
import { singletonRouter } from "../../lib/crud/singleton-router.js";
import { recordAudit } from "../audit/audit.service.js";
import { sendSuccess } from "../../utils/response.js";
import { GithubConfig } from "./github.model.js";
import { githubInput } from "./github.schema.js";
import { getGithubAdmin, syncGithub } from "./github.service.js";

/** Admin GitHub module: settings (singleton), cache status and a manual refresh. */
export const githubRoutes = Router()
  .get("/", async (_req, res) => sendSuccess(res, await getGithubAdmin()))
  .post("/refresh", async (req, res) => {
    const result = await syncGithub();
    await recordAudit(req, {
      action: "github.refresh",
      adminId: req.admin!.id,
      outcome: result.synced ? "success" : "failure",
      meta: result.synced ? {} : { reason: result.reason },
    });
    sendSuccess(res, { ...result, status: await getGithubAdmin() });
  })
  .use(
    "/settings",
    singletonRouter({
      resource: "github",
      label: "GitHub",
      model: GithubConfig,
      input: githubInput,
      defaults: {
        username: "",
        pinnedRepos: [],
        showContributions: true,
        showLanguages: true,
        showPullRequests: true,
      },
      tags: ["github"],
    }),
  );
