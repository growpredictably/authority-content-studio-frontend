"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────

export interface DraftRetentionPolicy {
  max_drafts_per_user: number;
  max_age_days: number;
  auto_cleanup_enabled: boolean;
}

const DEFAULT_POLICY: DraftRetentionPolicy = {
  max_drafts_per_user: 50,
  max_age_days: 90,
  auto_cleanup_enabled: true,
};

export interface SnapshotCacheTtl {
  gap_analysis_hours: number;
}

const DEFAULT_TTL: SnapshotCacheTtl = {
  gap_analysis_hours: 24,
};

// ─── Hooks ────────────────────────────────────────────────────

/** Read the draft retention policy from app_settings. Falls back to defaults. */
export function useDraftRetentionPolicy() {
  return useQuery({
    queryKey: ["app-settings", "draft_retention_policy"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "draft_retention_policy")
        .maybeSingle();

      return (data?.value as DraftRetentionPolicy) ?? DEFAULT_POLICY;
    },
    staleTime: 5 * 60_000,
  });
}

/** Read the snapshot cache TTL from app_settings. Falls back to 24h. */
export function useSnapshotCacheTtl() {
  return useQuery({
    queryKey: ["app-settings", "snapshot_cache_ttl"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "snapshot_cache_ttl")
        .maybeSingle();

      return (data?.value as SnapshotCacheTtl) ?? DEFAULT_TTL;
    },
    staleTime: 5 * 60_000,
  });
}

/** Update the snapshot cache TTL. */
export function useUpdateSnapshotCacheTtl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ttl: SnapshotCacheTtl) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("app_settings")
        .upsert(
          {
            key: "snapshot_cache_ttl",
            value: ttl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["app-settings", "snapshot_cache_ttl"],
      });
    },
  });
}
