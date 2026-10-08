"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  return useMutation({
    mutationFn: () => api.post("/auth/logout", undefined, { refreshOn401: false }),
    // Only on success: if sign-out fails the session cookies are still set, so reloading
    // would just land back in the admin. The shell shows the error instead.
    onSuccess: () => {
      notifySessionChange();
      // Full reload, not router.replace: Next.js keeps visited pages mounted (<Activity>) with
      // their state, so a soft navigation could resurrect signed-in UI. A reload clears all
      // client state, including the React Query cache.
      window.location.replace("/admin/login");
    },
  });
}
