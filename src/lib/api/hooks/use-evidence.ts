"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiCall } from "@/lib/api/client";
import type { RadarScanResponse } from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/** Trigger a radar evidence scan (POST). Returns mutation hook. */
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
