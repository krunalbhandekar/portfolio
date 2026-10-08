"use client";

import { useResourceOptions } from "@/lib/admin/resource-api";
import type { SelectOption } from "../kit/fields";

/** Skills as tag suggestions: value = slug (stored), label = name (shown). */
export function useSkillSuggestions(): SelectOption[] {
  const skills = useResourceOptions("skills");
  return (skills.data ?? []).filter((s) => s.slug).map((s) => ({ value: s.slug!, label: s.label }));
}
