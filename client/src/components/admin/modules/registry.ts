import type { ResourceConfig } from "../resources/types";
import { caseStudiesConfig } from "./case-studies";
import {
  achievementsConfig,
  builtFeaturesConfig,
  certificationsConfig,
  testimonialsConfig,
} from "./depth";
import { engineeringConfig } from "./engineering";
import { experienceConfig } from "./experience";
import { projectsConfig } from "./projects";
import { resumesConfig } from "./resumes";
import { capabilitiesConfig, skillsConfig } from "./skills";

/** Collection modules served by /admin/[resource] and /admin/[resource]/[id]. */
export const resourceRegistry: Record<string, ResourceConfig> = Object.fromEntries(
  [
    experienceConfig,
    projectsConfig,
    caseStudiesConfig,
    engineeringConfig,
    builtFeaturesConfig,
    skillsConfig,
    capabilitiesConfig,
    testimonialsConfig,
    achievementsConfig,
    certificationsConfig,
    resumesConfig,
  ].map((c) => [c.key, c]),
);
