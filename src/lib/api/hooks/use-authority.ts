"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiCall } from "@/lib/api/client";
import {
  getSnapshot,
  upsertSnapshot,
  deleteSnapshot,
  decrementActionsPending,
} from "@/lib/api/snapshot-cache";
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

const DEFAULT_GAP_TTL_HOURS = 24;

async function getGapAnalysisTtl(): Promise<number> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "snapshot_cache_ttl")
      .maybeSingle();
    return (data?.value as { gap_analysis_hours?: number })?.gap_analysis_hours ?? DEFAULT_GAP_TTL_HOURS;
  } catch {
    return DEFAULT_GAP_TTL_HOURS;
  }
}

export function useGapAnalysis(authorId: string | undefined) {
  return useQuery({
    queryKey: ["gap-analysis", authorId],
    queryFn: async () => {
      // 1. Check Supabase snapshot cache first
      const cached = await getSnapshot<GapAnalysisResponse>(
        authorId!,
        "gap_analysis"
      );
      if (cached) return cached;

      // 2. Cache miss — call Modal backend
      const token = await getToken();
      const response = await apiGet<GapAnalysisResponse>(
        `/v1/authority-packets/${authorId}/gap-analysis?include_groups=true&page_size=0`,
        token
      );

      // 3. Persist snapshot for future visits (non-blocking)
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const totalGaps = response.packet_gaps?.length ?? 0;
        const ttlHours = await getGapAnalysisTtl();
        upsertSnapshot(
          user.id,
          authorId!,
          "gap_analysis",
          response,
          totalGaps,
          ttlHours
        ).catch(() => {}); // fire-and-forget
      }

      return response;
    },
    enabled: !!authorId,
    staleTime: 30 * 60 * 1000, // 30 min in-memory cache on top of Supabase persistent cache
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
    onSuccess: (_data, variables) => {
      decrementActionsPending(variables.author_id, "gap_analysis").catch(
        () => {}
      );
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
    onSuccess: (_data, variables) => {
      // Data changed — delete snapshot so next visit fetches fresh
      deleteSnapshot(variables.author_id, "gap_analysis").catch(() => {});
      queryClient.invalidateQueries({ queryKey: ["gap-analysis"] });
      queryClient.invalidateQueries({ queryKey: ["authority-packets"] });
      queryClient.invalidateQueries({ queryKey: ["authority-score"] });
    },
  });
}
