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

/** List completed sessions (those with final_content) for All Content page. */
export function useCompletedSessions(
  userId: string | undefined,
  contentType?: string,
  search?: string,
  sort?: string
) {
  return useQuery({
    queryKey: ["all-content", userId, contentType, search, sort],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams({ user_id: userId! });
      if (contentType) params.set("content_type", contentType);
      if (search) params.set("search", search);
      if (sort) params.set("sort", sort);
      return apiGet<ContentSessionListResponse>(
        `/v1/content-sessions/completed?${params.toString()}`,
        token
      );
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

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
      queryClient.invalidateQueries({ queryKey: ["all-content"] });
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

/** Count empty draft sessions (no meaningful progress) for cleanup UI. */
export function useEmptyDraftsCount(userId: string | undefined) {
  return useQuery({
    queryKey: ["empty-drafts-count", userId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ count: number }>(
        `/v1/content-sessions/empty-count/${userId}`,
        token
      );
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

/** Bulk delete content sessions. */
export function useBulkDeleteSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionIds: string[]) => {
      const token = await getToken();
      return apiCall<{ success: boolean; deleted_count: number }>(
        "/v1/content-sessions/bulk-delete",
        { session_ids: sessionIds },
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["empty-drafts-count"] });
    },
  });
}
