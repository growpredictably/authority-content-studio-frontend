"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiCall, apiGet } from "@/lib/api/client";
import { upsertSnapshot } from "@/lib/api/snapshot-cache";
import type { RadarScanResponse, LeverageResponse } from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

export interface PacketTheme {
  theme: string;
  stage: string;
}

/**
 * Read packet themes from the cached asset_leverage snapshot in Supabase.
 * Falls back to calling the leverage API if no cache exists.
 */
export function usePacketThemes(authorId: string | undefined) {
  return useQuery({
    queryKey: ["packet-themes", authorId],
    queryFn: async () => {
      const supabase = createClient();

      // Read from cached asset_leverage snapshot (check expiry only)
      const { data } = await supabase
        .from("command_center_snapshots")
        .select("snapshot_data")
        .eq("author_id", authorId!)
        .eq("snapshot_type", "asset_leverage")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (data?.snapshot_data) {
        const payload = data.snapshot_data as Record<string, unknown>;
        const packetFlow = payload.packet_flow as
          | Record<string, unknown>
          | undefined;
        const packets = packetFlow?.packets as
          | Array<{ theme: string; stage: string }>
          | undefined;
        if (packets?.length) {
          return packets.map((p) => ({ theme: p.theme, stage: p.stage }));
        }
      }

      // Fallback: call leverage API
      const token = await getToken();
      const response = await apiGet<LeverageResponse>(
        `/v1/habits/leverage/${authorId}`,
        token
      );

      return (response.packet_flow?.packets ?? []).map((p) => ({
        theme: p.theme,
        stage: p.stage,
      }));
    },
    enabled: !!authorId,
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Load evidence for a selected packet theme.
 * Reads from the radar snapshot cache in Supabase first (expiry-only check).
 * Only calls the radar scan API on cache miss.
 */
export function useThemeEvidence(
  authorId: string | undefined,
  selectedTheme: string | null
) {
  return useQuery({
    queryKey: ["evidence-feed", authorId, selectedTheme],
    queryFn: async () => {
      const supabase = createClient();

      // Read radar snapshot directly from Supabase (no actions_pending gate)
      let query = supabase
        .from("command_center_snapshots")
        .select("snapshot_data")
        .eq("author_id", authorId!)
        .eq("snapshot_type", "radar")
        .gt("expires_at", new Date().toISOString());

      if (selectedTheme) {
        query = query.eq("belief_context", selectedTheme);
      } else {
        query = query.is("belief_context", null);
      }

      const { data } = await query.maybeSingle();

      if (data?.snapshot_data) {
        return data.snapshot_data as RadarScanResponse;
      }

      // Cache miss — call radar scan API
      if (!selectedTheme) throw new Error("No theme for radar scan");

      const token = await getToken();
      const result = await apiCall<RadarScanResponse>(
        "/v1/habits/radar/scan",
        {
          author_id: authorId!,
          belief_text: selectedTheme,
          scan_type: "evidence",
          max_results: 5,
        },
        token
      );

      // Cache the response (6h TTL, fire-and-forget)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        upsertSnapshot(
          user.id,
          authorId!,
          "radar",
          result,
          99,
          6,
          selectedTheme
        ).catch(() => {});
      }

      return result;
    },
    enabled: !!authorId && !!selectedTheme,
    staleTime: 5 * 60 * 1000,
  });
}

/** Manual radar scan (mutation) — user types a custom topic. */
export function useRadarScan() {
  return useMutation({
    mutationFn: async (payload: {
      author_id: string;
      belief_text: string;
      scan_type: "evidence" | "counter";
      max_results?: number;
    }) => {
      const token = await getToken();
      return apiCall<RadarScanResponse>(
        "/v1/habits/radar/scan",
        payload as unknown as Record<string, unknown>,
        token
      );
    },
  });
}
