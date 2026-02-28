"use client";

import { useQuery } from "@tanstack/react-query";
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

// ─── Hook ─────────────────────────────────────────────────────

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
