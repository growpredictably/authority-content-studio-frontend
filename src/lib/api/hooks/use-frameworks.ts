"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiCall, apiPatch, apiDelete } from "@/lib/api/client";
import type { FrameworkListResponse, BrandFramework } from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/** List all frameworks for the current author. */
export function useFrameworks(authorId: string | undefined) {
  return useQuery({
    queryKey: ["frameworks", authorId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<FrameworkListResponse>(
        `/v1/frameworks?author_id=${authorId}`,
        token
      );
    },
    enabled: !!authorId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Create a new framework. */
export function useCreateFramework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const token = await getToken();
      return apiCall<BrandFramework>("/v1/frameworks", payload, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frameworks"] });
    },
  });
}

/** Update an existing framework. */
export function useUpdateFramework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      frameworkId,
      ...data
    }: Record<string, unknown> & { frameworkId: string }) => {
      const token = await getToken();
      return apiPatch<BrandFramework>(
        `/v1/frameworks/${frameworkId}`,
        data,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frameworks"] });
    },
  });
}

/** Delete a framework. */
export function useDeleteFramework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (frameworkId: string) => {
      const token = await getToken();
      return apiDelete<{ success: boolean; deleted_id: string }>(
        `/v1/frameworks/${frameworkId}`,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frameworks"] });
    },
  });
}
