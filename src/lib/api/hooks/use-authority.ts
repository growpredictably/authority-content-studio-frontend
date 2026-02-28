"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiCall } from "@/lib/api/client";
import type {
  PacketsListResponse,
  PacketResponse,
  GapAnalysisResponse,
  RemediateGapRequest,
  RemediateGapResponse,
} from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

// ─── Packet Hooks ─────────────────────────────────────────────

export function usePackets(authorId: string | undefined) {
  return useQuery({
    queryKey: ["authority-packets", authorId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<PacketsListResponse>(
        `/v1/authority-packets/${authorId}`,
        token
      );
    },
    enabled: !!authorId,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePacketDetail(packetId: string | undefined) {
  return useQuery({
    queryKey: ["authority-packet-detail", packetId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<PacketResponse>(
        `/v1/authority-packets/packet/${packetId}`,
        token
      );
    },
    enabled: !!packetId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRebuildPacket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (packetId: string) => {
      const token = await getToken();
      return apiCall<PacketResponse>(
        `/v1/authority-packets/rebuild/${packetId}`,
        {},
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authority-packets"] });
      queryClient.invalidateQueries({
        queryKey: ["authority-packet-detail"],
      });
      queryClient.invalidateQueries({ queryKey: ["authority-score"] });
    },
  });
}

export function useBuildAllPackets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      author_id: string;
      brand_id?: string;
      force_rebuild?: boolean;
    }) => {
      const token = await getToken();
      return apiCall<{ packets_built: number }>(
        "/v1/authority-packets/build",
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

// ─── Gap Analysis Hooks ───────────────────────────────────────

export function useGapAnalysis(authorId: string | undefined) {
  return useQuery({
    queryKey: ["gap-analysis", authorId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<GapAnalysisResponse>(
        `/v1/authority-packets/${authorId}/gap-analysis?include_groups=true`,
        token
      );
    },
    enabled: !!authorId,
    staleTime: 30 * 60 * 1000, // 30 min — runs LLM calls, expensive
  });
}

export function useMarkGapComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      author_id: string;
      gap_action_id: string;
    }) => {
      const token = await getToken();
      return apiCall<{ success: boolean }>(
        "/v1/gap-analysis/track/complete",
        payload as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gap-analysis"] });
      queryClient.invalidateQueries({ queryKey: ["authority-packets"] });
      queryClient.invalidateQueries({ queryKey: ["authority-score"] });
    },
  });
}

export function useRemediateGap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: RemediateGapRequest) => {
      const token = await getToken();
      return apiCall<RemediateGapResponse>(
        "/v1/authority-packets/remediate-gap",
        request as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gap-analysis"] });
      queryClient.invalidateQueries({ queryKey: ["authority-packets"] });
      queryClient.invalidateQueries({ queryKey: ["authority-score"] });
    },
  });
}
