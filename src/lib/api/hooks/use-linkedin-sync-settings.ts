"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiPatch } from "@/lib/api/client";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

export interface LinkedInSyncSettings {
  linkedin_sync_max_posts: number;
  linkedin_sync_max_comments: number;
  linkedin_sync_max_reactions: number;
  linkedin_sync_include_reposts: boolean;
  linkedin_sync_include_quote_posts: boolean;
  linkedin_sync_scrape_comments: boolean;
  linkedin_sync_scrape_reactions: boolean;
}

/** Get the current user's LinkedIn sync defaults. */
export function useLinkedInSyncSettings() {
  return useQuery({
    queryKey: ["linkedin-sync-settings"],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiGet<{ settings: LinkedInSyncSettings }>(
        "/v1/profile/linkedin-sync",
        token
      );
      return res.settings;
    },
    staleTime: 5 * 60_000,
  });
}

/** Update the current user's LinkedIn sync defaults. */
export function useUpdateLinkedInSyncSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<LinkedInSyncSettings>) => {
      const token = await getToken();
      const res = await apiPatch<{ settings: LinkedInSyncSettings }>(
        "/v1/profile/linkedin-sync",
        updates as Record<string, unknown>,
        token
      );
      return res.settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["linkedin-sync-settings"],
      });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}
