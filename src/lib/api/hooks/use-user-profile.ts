"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiPatch } from "@/lib/api/client";
import type { UserProfile } from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/** Get the current user's profile. */
export function useUserProfile() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiGet<{ profile: UserProfile }>("/v1/profile", token);
      return res.profile;
    },
    staleTime: 5 * 60_000,
  });
}

/** Update the current user's profile. */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const token = await getToken();
      const res = await apiPatch<{ profile: UserProfile }>(
        "/v1/profile",
        updates as Record<string, unknown>,
        token
      );
      return res.profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}
