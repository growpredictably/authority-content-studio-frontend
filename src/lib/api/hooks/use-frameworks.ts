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

/** Fetch a single framework by ID. */
export function useFramework(frameworkId: string | undefined) {
  return useQuery({
    queryKey: ["framework", frameworkId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<BrandFramework>(
        `/v1/frameworks/${frameworkId}`,
        token
      );
    },
    enabled: !!frameworkId,
    staleTime: 2 * 60 * 1000,
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
      queryClient.invalidateQueries({ queryKey: ["framework"] });
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
      queryClient.invalidateQueries({ queryKey: ["framework"] });
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
      queryClient.invalidateQueries({ queryKey: ["framework"] });
    },
  });
}

/** Reorder frameworks by providing an ordered list of IDs. */
export function useReorderFrameworks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      authorId,
      orderedIds,
    }: {
      authorId: string;
      orderedIds: string[];
    }) => {
      const token = await getToken();
      return apiPatch<{ success: boolean }>(
        "/v1/frameworks/reorder",
        { author_id: authorId, ordered_ids: orderedIds },
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frameworks"] });
      queryClient.invalidateQueries({ queryKey: ["framework"] });
    },
  });
}

/** List predefined frameworks available for import. */
export function usePredefinedFrameworks() {
  return useQuery({
    queryKey: ["predefined-frameworks"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<FrameworkListResponse>("/v1/frameworks/library", token);
    },
    staleTime: 30 * 60 * 1000,
  });
}

/** Import a predefined framework into the user's brand. */
export function useImportFramework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      authorId,
      predefinedFrameworkId,
    }: {
      authorId: string;
      predefinedFrameworkId: string;
    }) => {
      const token = await getToken();
      return apiCall<BrandFramework>(
        "/v1/frameworks/import",
        {
          author_id: authorId,
          predefined_framework_id: predefinedFrameworkId,
        },
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frameworks"] });
      queryClient.invalidateQueries({ queryKey: ["framework"] });
    },
  });
}
