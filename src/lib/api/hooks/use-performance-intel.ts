"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiCall } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

export interface PerformanceIntel {
  top_topics?: Array<{
    topic: string;
    avg_engagement: number;
    post_count: number;
    insight: string;
  }>;
  best_hooks?: Array<{
    style: string;
    example: string;
    avg_engagement: number;
    insight: string;
  }>;
  best_formats?: Array<{
    format: string;
    avg_engagement: number;
    post_count: number;
    insight: string;
  }>;
  engagement_insights?: Array<{
    pattern: string;
    evidence: string;
    recommendation: string;
  }>;
  audience_preferences?: {
    responds_to: string[];
    avoids: string[];
    sweet_spot_length: string;
  };
  summary?: string;
}

export interface PerformanceIntelResponse {
  intel: PerformanceIntel;
  posts_analyzed: number;
  analyzed_at: string;
}

/**
 * Fetch cached performance intelligence for an author.
 */
export function usePerformanceIntel(authorId: string | undefined) {
  return useQuery({
    queryKey: ["performance-intel", authorId],
    queryFn: async (): Promise<PerformanceIntelResponse | null> => {
      const token = await getToken();
      try {
        return await apiGet<PerformanceIntelResponse>(
          `/v1/performance/${authorId}/intel`,
          token
        );
      } catch (e: unknown) {
        // 404 means no analysis has been run yet — not an error
        if (e && typeof e === "object" && "status" in e && (e as { status: number }).status === 404) {
          return null;
        }
        throw e;
      }
    },
    enabled: !!authorId,
    staleTime: 10 * 60 * 1000, // 10 min cache
  });
}

/**
 * Trigger performance analysis (LLM analyzes author's posts).
 */
export function useAnalyzePerformance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (authorId: string) => {
      const token = await getToken();
      return apiCall<PerformanceIntelResponse>(
        `/v1/performance/${authorId}/analyze`,
        {},
        token
      );
    },
    onSuccess: (_data, authorId) => {
      queryClient.invalidateQueries({ queryKey: ["performance-intel", authorId] });
    },
  });
}
