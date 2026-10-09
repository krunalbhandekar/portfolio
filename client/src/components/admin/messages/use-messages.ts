"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Message = {
  _id: string;
  name: string;
  email: string;
  subject?: string;
  reason?: string;
  message: string;
  read: boolean;
  archived: boolean;
  emailed?: boolean;
  createdAt: string;
};

export type Box = "inbox" | "unread" | "archived" | "all";

export const messageKeys = {
  all: ["admin", "messages"] as const,
  list: (box: Box, q: string, page: number) => ["admin", "messages", "list", box, q, page] as const,
  unread: ["admin", "messages", "unread"] as const,
};

export function useMessages(box: Box, q: string, page: number) {
  return useQuery({
    queryKey: messageKeys.list(box, q, page),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ box, page: String(page), limit: "25" });
      if (q) params.set("q", q);
      return api.list<Message>(`/admin/messages?${params}`, { signal });
    },
    placeholderData: keepPreviousData,
  });
}

/** Unread count for the sidebar badge; polls every minute while the admin is open. */
export function useUnreadCount() {
  return useQuery({
    queryKey: messageKeys.unread,
    queryFn: ({ signal }) =>
      api.get<{ count: number }>("/admin/messages/unread-count", { signal }).then((d) => d.count),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; read?: boolean; archived?: boolean }) =>
      api.patch<Message>(`/admin/messages/${id}`, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageKeys.all }),
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/messages/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageKeys.all }),
  });
}
