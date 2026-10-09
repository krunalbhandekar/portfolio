"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { aboutConfig } from "../modules/about";
import { githubConfig } from "../modules/github";
import { homepageConfig } from "../modules/homepage";
import { resourceRegistry } from "../modules/registry";
import { settingsConfig } from "../modules/settings";
import { ResourceEditor } from "./resource-editor";
import { ResourceList } from "./resource-list";
import { SingletonEditor } from "./singleton-editor";

/*
 * Client entry points for the admin pages. Module configs hold components, so they can't be
 * passed from server pages as props; pages render these wrappers instead.
 */

export function ResourceListRoute({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = use(params);
  const config = resourceRegistry[resource];
  if (!config) notFound();
  return <ResourceList key={config.key} config={config} />;
}

export function ResourceEditorRoute({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource, id } = use(params);
  const config = resourceRegistry[resource];
  if (!config || !(id === "new" || /^[a-f\d]{24}$/i.test(id))) notFound();
  return <ResourceEditor key={`${config.key}-${id}`} config={config} id={id} />;
}

export const SettingsEditor = () => <SingletonEditor config={settingsConfig} />;
export const HomepageEditor = () => <SingletonEditor config={homepageConfig} />;
export const AboutEditor = () => <SingletonEditor config={aboutConfig} />;
export const GithubEditor = () => <SingletonEditor config={githubConfig} />;
