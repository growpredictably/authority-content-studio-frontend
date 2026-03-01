"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiCall, apiPatch, apiDelete } from "@/lib/api/client";
import type { ICPListResponse, ICP, ICPGenerateResponse } from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/** List all ICPs for the current author. */
export function useICPs(authorId: string | undefined) {
  return useQuery({
    queryKey: ["icps", authorId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<ICPListResponse>(`/v1/icps?author_id=${authorId}`, token);
    },
    enabled: !!authorId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Get a single ICP with pains/gains. */
export function useICPDetail(icpId: string | undefined) {
  return useQuery({
    queryKey: ["icp-detail", icpId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<ICP>(`/v1/icps/${icpId}`, token);
    },
    enabled: !!icpId,
  });
}

/** Create a new ICP. */
export function useCreateICP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const token = await getToken();
      return apiCall<ICP>("/v1/icps", payload, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icps"] });
      queryClient.invalidateQueries({ queryKey: ["icp-detail"] });
    },
  });
}

/** Update an existing ICP. */
export function useUpdateICP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      icpId,
      ...data
    }: Record<string, unknown> & { icpId: string }) => {
      const token = await getToken();
      return apiPatch<ICP>(`/v1/icps/${icpId}`, data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icps"] });
      queryClient.invalidateQueries({ queryKey: ["icp-detail"] });
    },
  });
}

/** Generate an ICP from target audience description using AI. */
export function useGenerateICP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      target_audience: string;
      target_audience_context?: string;
      brand_id: string;
    }) => {
      const token = await getToken();
      return apiCall<ICPGenerateResponse>(
        "/v1/icps/generate",
        payload as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icps"] });
      queryClient.invalidateQueries({ queryKey: ["icp-detail"] });
    },
  });
}

/** Delete an ICP and its pains/gains. */
export function useDeleteICP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (icpId: string) => {
      const token = await getToken();
      return apiDelete<{ success: boolean; deleted_id: string }>(
        `/v1/icps/${icpId}`,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icps"] });
      queryClient.invalidateQueries({ queryKey: ["icp-detail"] });
    },
  });
}
