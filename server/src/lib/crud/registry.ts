import type { Model, Types } from "mongoose";

export type RegistryDoc = Record<string, unknown> & { _id: Types.ObjectId };

/**
 * Every admin-editable resource, registered by the CRUD/singleton routers. Used by features that
 * work across all content types: revisions/restore, scheduled publishing and backups.
 */
export type RegisteredResource = {
  resource: string;
  kind: "collection" | "singleton";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any content model
  model: Model<any>;
  label: (doc: RegistryDoc) => string;
  tags: (doc: RegistryDoc, previous?: RegistryDoc | null) => string[];
  /** Public URL for a slug (collections with pages), used for automatic redirects. */
  publicPath?: (slug: string) => string;
  afterSave?: (doc: RegistryDoc) => Promise<void>;
  /** Singleton key (`default`, or `now`/`uses`/`faq` for pages). */
  singletonKey?: string;
};

export const registry = new Map<string, RegisteredResource>();

export function registerResource(entry: RegisteredResource) {
  registry.set(entry.resource, entry);
}
