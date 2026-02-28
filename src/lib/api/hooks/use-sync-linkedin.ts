"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiCall } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

interface SyncLinkedInParams {
  user_id: string;
  author_id: string;
  author_name: string;
  brand_id: string;
  targetUrl: string;
  sync_all?: boolean;
}

interface SyncLinkedInResponse {
  success: boolean;
  posts_synced: number;
  message: string;
}

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/**
 * Trigger a LinkedIn post sync via Apify scraper.
 * After sync completes, invalidates the performance query so data refreshes.
 */
export function useSyncLinkedIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SyncLinkedInParams) => {
      const token = await getToken();
      return apiCall<SyncLinkedInResponse>("/v1/sync-linkedin", {
        user_id: params.user_id,
        author_id: params.author_id,
        author_name: params.author_name,
        brand_id: params.brand_id,
        sync_all: params.sync_all ?? false,
        targetUrls: [params.targetUrl],
        maxPosts: params.sync_all ? 100 : 20,
        maxComments: 5,
        maxReactions: 5,
        includeReposts: true,
        includeQuotePosts: true,
        scrapeComments: false,
        scrapeReactions: false,
      }, token);
    },
    onSuccess: (_data, params) => {
      // Invalidate performance data so it refreshes
      queryClient.invalidateQueries({ queryKey: ["performance", params.author_id] });
    },
  });
}

/**
 * Fetch the LinkedIn profile URL from existing synced posts.
 * Returns null if no posts have been synced yet.
 */
export async function getLinkedInProfileUrl(authorId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("my_linkedin_posts")
    .select("linkedin_profile_url")
    .eq("author_id", authorId)
    .not("linkedin_profile_url", "is", null)
    .limit(1)
    .single();
  return data?.linkedin_profile_url ?? null;
}
