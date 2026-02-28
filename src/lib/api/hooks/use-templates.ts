"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet } from "@/lib/api/client";
import type { TemplatesListResponse } from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/** List LinkedIn post templates, optionally filtered by category. */
export function useTemplates(category?: string) {
  return useQuery({
    queryKey: ["templates", category ?? "all"],
    queryFn: async () => {
      const token = await getToken();
      const qs = category ? `?category=${encodeURIComponent(category)}` : "";
      return apiGet<TemplatesListResponse>(`/v1/templates${qs}`, token);
    },
    staleTime: 10 * 60 * 1000,
  });
}
