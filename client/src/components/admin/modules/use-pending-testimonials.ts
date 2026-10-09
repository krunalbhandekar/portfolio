"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { resourceKeys } from "@/lib/admin/resource-api";

/**
 * Visitor-submitted testimonials still in draft (sidebar badge). Keyed under the testimonials
 * resource, so publishing or deleting one refreshes the count immediately.
 */
export function usePendingTestimonials() {
  return useQuery({
    queryKey: [...resourceKeys.all("testimonials"), "pending-count"],
    queryFn: ({ signal }) =>
      api
        .get<{ count: number }>("/admin/testimonials/pending-count", { signal })
        .then((d) => d.count),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
