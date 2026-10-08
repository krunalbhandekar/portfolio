"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { notifySessionChange } from "@/lib/session-hint";

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
};

export const authKeys = { me: ["auth", "me"] as const };

/** Current admin from `/auth/me`. A 401 triggers one silent refresh inside the API client. */
export function useCurrentAdmin() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: ({ signal }) =>
      api.get<{ admin: AdminUser }>("/auth/me", { signal }).then((d) => d.admin),
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useGoogleLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credential: string) =>
      api
        .post<{ admin: AdminUser }>("/auth/google", { credential }, { refreshOn401: false })
        .then((d) => d.admin),
    onSuccess: (admin) => {
      queryClient.setQueryData(authKeys.me, admin);
      notifySessionChange();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => api.post("/auth/logout", undefined, { refreshOn401: false }),
    onSettled: () => {
      queryClient.clear();
      notifySessionChange();
      router.replace("/admin/login");
    },
  });
}
