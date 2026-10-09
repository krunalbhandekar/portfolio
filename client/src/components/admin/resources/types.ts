import type { ComponentType, ReactNode } from "react";
import type { ContentDoc } from "@/lib/admin/types";

export type Column = {
  header: string;
  cell: (doc: ContentDoc) => ReactNode;
  /** API field for `?sort=`; omit for unsortable columns. */
  sortKey?: string;
  className?: string;
};

export type ResourceConfig = {
  /** Admin URL segment, e.g. "experience" → /admin/experience. */
  key: string;
  /** Admin API segment, e.g. "experiences" → /api/v1/admin/experiences. */
  apiPath: string;
  title: string;
  singular: string;
  description: string;
  /** Field shown as the item's name (editor title, delete confirmation). */
  labelField: string;
  columns: Column[];
  /** Initial values for "New …" — every field the form renders. */
  defaults: Record<string, unknown>;
  /** Form body, rendered inside a react-hook-form <FormProvider>. */
  Fields: ComponentType;
  /** Public path for "Preview" (Next.js Draft Mode); omit for modules without a page. */
  previewPath?: (doc: ContentDoc) => string | null;
};

export type SingletonConfig = {
  apiPath: string;
  title: string;
  description: string;
  defaults: Record<string, unknown>;
  Fields: ComponentType;
  /** Server resource name for revision history, when it differs from `apiPath`. */
  resource?: string;
  /** Shapes the loaded document into form values (e.g. one row per fixed page). */
  fromDocument?: (doc: Record<string, unknown>) => Record<string, unknown>;
};
