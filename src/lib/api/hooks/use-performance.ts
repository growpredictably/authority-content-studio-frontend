"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet } from "@/lib/api/client";
import type { PerformanceResponse } from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/** Fetch LinkedIn performance data for an author. */
export function usePerformance(authorId: string | undefined) {
  return useQuery({
    queryKey: ["performance", authorId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<PerformanceResponse>(
        `/v1/performance/${authorId}`,
        token
      );
    },
    enabled: !!authorId,
    staleTime: 2 * 60 * 1000,
  });
}
