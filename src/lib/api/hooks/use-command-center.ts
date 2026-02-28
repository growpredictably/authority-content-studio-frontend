"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiCall } from "@/lib/api/client";
import type {
  AuthorityScoreResponse,
  DailySyncResponse,
  ActionCompleteRequest,
  ActionCompleteResponse,
  LeverageResponse,
  HabitStats,
} from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/** GET /v1/authority-score/{author_id} */
export function useAuthorityScore(authorId: string | undefined) {
  return useQuery({
    queryKey: ["authority-score", authorId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<AuthorityScoreResponse>(
        `/v1/authority-score/${authorId}`,
        token
      );
    },
    enabled: !!authorId,
    staleTime: 15 * 60 * 1000, // 15 min — runs 6 DB queries
  });
}

/** GET /v1/habits/sync/{author_id} */
export function useDailySync(authorId: string | undefined) {
  return useQuery({
    queryKey: ["daily-sync", authorId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<DailySyncResponse>(
        `/v1/habits/sync/${authorId}`,
        token
      );
    },
    enabled: !!authorId,
    staleTime: 30 * 60 * 1000,
  });
}

/** GET /v1/habits/leverage/{author_id} */
export function useLeverage(authorId: string | undefined) {
  return useQuery({
    queryKey: ["leverage", authorId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<LeverageResponse>(
        `/v1/habits/leverage/${authorId}`,
        token
      );
    },
    enabled: !!authorId,
    staleTime: 15 * 60 * 1000, // 15 min — computational endpoint
  });
}

/** GET /v1/habits/stats/{author_id} */
export function useHabitStats(authorId: string | undefined) {
  return useQuery({
    queryKey: ["habit-stats", authorId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ success: boolean; author_id: string; habit_stats: HabitStats }>(
        `/v1/habits/stats/${authorId}`,
        token
      );
    },
    enabled: !!authorId,
    staleTime: 2 * 60 * 1000,
  });
}

/** POST /v1/habits/action/complete */
export function useCompleteAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: ActionCompleteRequest) => {
      const token = await getToken();
      return apiCall<ActionCompleteResponse>(
        "/v1/habits/action/complete",
        request as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-sync"] });
      queryClient.invalidateQueries({ queryKey: ["authority-score"] });
      queryClient.invalidateQueries({ queryKey: ["leverage"] });
      queryClient.invalidateQueries({ queryKey: ["habit-stats"] });
    },
  });
}
