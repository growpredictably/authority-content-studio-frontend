"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiCall, apiPatch } from "@/lib/api/client";
import type {
  ContentSessionListResponse,
  ContentSession,
  OutcomeUpdateRequest,
} from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

// ─── Query Hooks ─────────────────────────────────────────────

/** List sessions for an author, newest first. */
export function useContentSessions(
  authorId: string | undefined,
  status?: string
) {
  return useQuery({
    queryKey: ["content-sessions", authorId, status],
    queryFn: async () => {
      const token = await getToken();
      const params = status ? `?status=${status}` : "";
      return apiGet<ContentSessionListResponse>(
        `/v1/content-sessions/${authorId}${params}`,
        token
      );
    },
    enabled: !!authorId,
    staleTime: 60 * 1000,
  });
}

/** Get a single session with full JSONB state. */
export function useContentSessionDetail(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["content-session-detail", sessionId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<ContentSession>(
        `/v1/content-sessions/detail/${sessionId}`,
        token
      );
    },
    enabled: !!sessionId,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────

/** Create or update a content session. */
export function useSaveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const token = await getToken();
      return apiCall<ContentSession>("/v1/content-sessions", payload, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sessions"] });
    },
  });
}

/** Update outcome fields (impressions, likes, etc.). */
export function useUpdateOutcome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      ...data
    }: OutcomeUpdateRequest & { sessionId: string }) => {
      const token = await getToken();
      return apiPatch<Record<string, unknown>>(
        `/v1/content-sessions/${sessionId}/outcome`,
        data as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sessions"] });
      queryClient.invalidateQueries({
        queryKey: ["content-session-detail"],
      });
    },
  });
}

/** Archive a session. */
export function useArchiveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const token = await getToken();
      return apiPatch<{ success: boolean }>(
        `/v1/content-sessions/${sessionId}/archive`,
        {},
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sessions"] });
    },
  });
}
