import type { ResourceConfig } from "../resources/types";
import { experienceConfig } from "./experience";
import { projectsConfig } from "./projects";
import { resumesConfig } from "./resumes";
import { capabilitiesConfig, skillsConfig } from "./skills";

/** Collection modules served by /admin/[resource] and /admin/[resource]/[id]. */
export const resourceRegistry: Record<string, ResourceConfig> = Object.fromEntries(
  [experienceConfig, projectsConfig, skillsConfig, capabilitiesConfig, resumesConfig].map((c) => [
    c.key,
    c,
  ]),
);
