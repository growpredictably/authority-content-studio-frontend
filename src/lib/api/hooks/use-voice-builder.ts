"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiCall, apiGet } from "@/lib/api/client";
import type {
  VoiceMiningRequest,
  VoiceMiningResponse,
  MiningJobStatus,
  VoiceIngestData,
  VoiceIngestResponse,
  VoiceIngestConflictResponse,
  ConflictResolution,
} from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

// ─── Mining Hooks ────────────────────────────────────────────

export function useStartMining() {
  return useMutation({
    mutationFn: async (request: VoiceMiningRequest) => {
      const token = await getToken();
      return apiCall<VoiceMiningResponse>(
        "/v1/voice-builder/mine",
        request as unknown as Record<string, unknown>,
        token
      );
    },
  });
}

export function useMiningStatus(
  jobId: string | undefined,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["mining-job", jobId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<MiningJobStatus>(
        `/v1/voice-builder/mine/${jobId}`,
        token
      );
    },
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 2000;
    },
  });
}

// ─── Ingest Hooks ────────────────────────────────────────────

export function useIngestDna() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      data: VoiceIngestData;
      author_id: string;
      user_id: string;
      metadata?: Record<string, unknown>;
    }) => {
      const token = await getToken();
      return apiCall<VoiceIngestResponse | VoiceIngestConflictResponse>(
        "/v1/voice-builder/ingest",
        payload as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: (data) => {
      if ("success" in data && data.success) {
        queryClient.invalidateQueries({ queryKey: ["authority-packets"] });
        queryClient.invalidateQueries({ queryKey: ["authority-score"] });
        queryClient.invalidateQueries({ queryKey: ["gap-analysis"] });
      }
    },
  });
}

export function useResolveConflicts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      author_id: string;
      user_id: string;
      data: VoiceIngestData;
      conflict_resolutions: ConflictResolution[];
      metadata?: Record<string, unknown>;
    }) => {
      const token = await getToken();
      return apiCall<VoiceIngestResponse>(
        "/v1/voice-builder/ingest/resolve-conflicts",
        payload as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authority-packets"] });
      queryClient.invalidateQueries({ queryKey: ["authority-score"] });
      queryClient.invalidateQueries({ queryKey: ["gap-analysis"] });
    },
  });
}
