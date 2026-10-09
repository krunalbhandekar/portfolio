"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ContentDoc, ResourceOption } from "./types";

export type ListParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  sort?: string;
};

const toQuery = (params: ListParams) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const resourceKeys = {
  all: (api: string) => ["admin", api] as const,
  list: (api: string, params: ListParams) => ["admin", api, "list", params] as const,
  item: (api: string, id: string) => ["admin", api, "item", id] as const,
  options: (api: string) => ["admin", api, "options"] as const,
};

/** `apiPath` is the admin API segment, e.g. "projects" → /admin/projects. */
export function useResourceList(apiPath: string, params: ListParams) {
  return useQuery({
    queryKey: resourceKeys.list(apiPath, params),
    queryFn: ({ signal }) =>
      api.list<ContentDoc>(`/admin/${apiPath}${toQuery(params)}`, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useResourceItem(apiPath: string, id: string | null) {
  return useQuery({
    queryKey: resourceKeys.item(apiPath, id ?? "new"),
    queryFn: ({ signal }) => api.get<ContentDoc>(`/admin/${apiPath}/${id}`, { signal }),
    enabled: !!id,
  });
}

export function useResourceOptions(apiPath: string) {
  return useQuery({
    queryKey: resourceKeys.options(apiPath),
    queryFn: ({ signal }) => api.get<ResourceOption[]>(`/admin/${apiPath}/options`, { signal }),
    staleTime: 60_000,
  });
}

function useInvalidate(apiPath: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: resourceKeys.all(apiPath) });
}

export function useSaveResource(apiPath: string) {
  const invalidate = useInvalidate(apiPath);
  return useMutation({
    mutationFn: ({ id, values }: { id: string | null; values: unknown }) =>
      id
        ? api.put<ContentDoc>(`/admin/${apiPath}/${id}`, values)
        : api.post<ContentDoc>(`/admin/${apiPath}`, values),
    onSuccess: invalidate,
  });
}

export function useDeleteResource(apiPath: string) {
  const invalidate = useInvalidate(apiPath);
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/${apiPath}/${id}`),
    onSuccess: invalidate,
  });
}

export function usePublishResource(apiPath: string) {
  const invalidate = useInvalidate(apiPath);
  return useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      api.post<ContentDoc>(`/admin/${apiPath}/${id}/${publish ? "publish" : "unpublish"}`),
    onSuccess: invalidate,
  });
}

export function useReorderResource(apiPath: string) {
  const invalidate = useInvalidate(apiPath);
  return useMutation({
    mutationFn: (ids: string[]) => api.patch(`/admin/${apiPath}/reorder`, { ids }),
    onSettled: invalidate,
  });
}

export function useSingleton(apiPath: string) {
  return useQuery({
    queryKey: resourceKeys.item(apiPath, "singleton"),
    queryFn: ({ signal }) => api.get<Record<string, unknown>>(`/admin/${apiPath}`, { signal }),
  });
}

export function useSaveSingleton(apiPath: string) {
  const invalidate = useInvalidate(apiPath);
  return useMutation({
    mutationFn: (values: unknown) => api.put<Record<string, unknown>>(`/admin/${apiPath}`, values),
    onSuccess: invalidate,
  });
}
