"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiCall, apiGet, apiPatch } from "@/lib/api/client";
import type {
  BrainCurateResponse,
  BrainCommitItem,
  BrainCommitResponse,
  BrainLibraryResponse,
  BrainSearchResponse,
} from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

// ─── Curation Hooks ──────────────────────────────────────────

export function useCurateUrl() {
  return useMutation({
    mutationFn: async (payload: {
      url: string;
      author_id: string;
      raw_text?: string;
    }) => {
      const token = await getToken();
      return apiCall<BrainCurateResponse>(
        "/v1/brain-builder/curate",
        payload as unknown as Record<string, unknown>,
        token
      );
    },
  });
}

export function useCommitKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      author_id: string;
      items: BrainCommitItem[];
    }) => {
      const token = await getToken();
      return apiCall<BrainCommitResponse>(
        "/v1/brain-builder/commit",
        payload as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brain-library"] });
      queryClient.invalidateQueries({ queryKey: ["authority-score"] });
    },
  });
}

// ─── Library Hooks ───────────────────────────────────────────

export function useBrainLibrary(
  authorId: string | undefined,
  endorsementFilter?: string
) {
  const params = new URLSearchParams();
  if (endorsementFilter) params.set("endorsement_filter", endorsementFilter);
  const qs = params.toString();

  return useQuery({
    queryKey: ["brain-library", authorId, endorsementFilter],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<BrainLibraryResponse>(
        `/v1/brain-builder/${authorId}${qs ? `?${qs}` : ""}`,
        token
      );
    },
    enabled: !!authorId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Search Hook ─────────────────────────────────────────────

export function useBrainSearch() {
  return useMutation({
    mutationFn: async (payload: {
      author_id: string;
      query: string;
      threshold?: number;
      top_k?: number;
      endorsement_filter?: string[];
    }) => {
      const token = await getToken();
      return apiCall<BrainSearchResponse>(
        "/v1/brain-builder/search",
        payload as unknown as Record<string, unknown>,
        token
      );
    },
  });
}

// ─── Update Hook ─────────────────────────────────────────────

export function useUpdateKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      knowledge_id: string;
      updates: {
        endorsement_level?: string;
        title?: string;
        summary?: string;
        user_notes?: string;
        strategic_tags?: string[];
      };
    }) => {
      const token = await getToken();
      return apiPatch<{ success: boolean; knowledge_id: string }>(
        `/v1/brain-builder/${payload.knowledge_id}`,
        payload.updates as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brain-library"] });
    },
  });
}
