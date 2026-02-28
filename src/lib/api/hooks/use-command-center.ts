"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiCall, apiDelete } from "@/lib/api/client";
import { deleteSnapshot } from "@/lib/api/snapshot-cache";
import type {
  AuthorityScoreResponse,
  DailySyncResponse,
  ActionCompleteRequest,
  ActionCompleteResponse,
  LeverageResponse,
  HabitStats,
  RadarScanRequest,
  RadarScanResponse,
  SavedActionsResponse,
  SyncAction,
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

/** POST /v1/habits/radar/scan */
export function useRadarScan() {
  return useMutation({
    mutationFn: async (request: RadarScanRequest) => {
      const token = await getToken();
      return apiCall<RadarScanResponse>(
        "/v1/habits/radar/scan",
        request as unknown as Record<string, unknown>,
        token
      );
    },
  });
}

/** GET /v1/habits/saved/{author_id} */
export function useSavedActions(authorId: string | undefined) {
  return useQuery({
    queryKey: ["saved-actions", authorId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<SavedActionsResponse>(
        `/v1/habits/saved/${authorId}`,
        token
      );
    },
    enabled: !!authorId,
    staleTime: 2 * 60 * 1000,
  });
}

/** POST /v1/habits/saved */
export function useSaveAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: { author_id: string; action_payload: SyncAction; note?: string }) => {
      const token = await getToken();
      return apiCall<{ success: boolean; id: string }>(
        "/v1/habits/saved",
        request as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-actions"] });
    },
  });
}

/** DELETE /v1/habits/saved/{action_id} */
export function useDismissSavedAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (actionId: string) => {
      const token = await getToken();
      return apiDelete<{ success: boolean }>(
        `/v1/habits/saved/${actionId}`,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-actions"] });
    },
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
    onSuccess: (_data, variables) => {
      // CLARIFY actions change gap data — delete snapshot so next visit fetches fresh
      deleteSnapshot(variables.author_id, "gap_analysis").catch(() => {});
      queryClient.invalidateQueries({ queryKey: ["daily-sync"] });
      queryClient.invalidateQueries({ queryKey: ["authority-score"] });
      queryClient.invalidateQueries({ queryKey: ["leverage"] });
      queryClient.invalidateQueries({ queryKey: ["habit-stats"] });
      queryClient.invalidateQueries({ queryKey: ["gap-analysis"] });
    },
  });
}
