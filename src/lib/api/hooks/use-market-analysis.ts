"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiCall } from "@/lib/api/client";
import type {
  MarketSessionsResponse,
  MarketSessionDetailResponse,
  MarketHuntResponse,
  MarketHuntRequest,
} from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/** List past market analysis sessions for a user. */
export function useMarketSessions(userId: string | undefined) {
  return useQuery({
    queryKey: ["market-sessions", userId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<MarketSessionsResponse>(
        `/v1/market-analysis/sessions?user_id=${userId}`,
        token
      );
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Get all posts for a specific session. */
export function useMarketSessionDetail(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["market-session-detail", sessionId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<MarketSessionDetailResponse>(
        `/v1/market-analysis/sessions/${sessionId}`,
        token
      );
    },
    enabled: !!sessionId,
  });
}

/** Hunt winning posts on LinkedIn. */
export function useHuntWinningPosts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: MarketHuntRequest) => {
      const token = await getToken();
      return apiCall<MarketHuntResponse>(
        "/v1/market-analysis/hunt-winning-posts",
        request as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-sessions"] });
    },
  });
}
