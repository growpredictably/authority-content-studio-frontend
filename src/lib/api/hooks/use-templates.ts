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

/** List structure archetypes (content templates), optionally filtered by content_type. */
export function useTemplates(contentType?: string) {
  return useQuery({
    queryKey: ["templates", contentType ?? "all"],
    queryFn: async () => {
      const token = await getToken();
      const qs = contentType ? `?content_type=${contentType}` : "";
      return apiGet<TemplatesListResponse>(`/v1/templates${qs}`, token);
    },
    staleTime: 10 * 60 * 1000,
  });
}
