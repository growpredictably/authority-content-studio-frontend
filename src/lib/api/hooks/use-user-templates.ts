"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiCall, apiPatch, apiDelete } from "@/lib/api/client";
import type { UserTemplate, UserTemplatesListResponse } from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/** List user-created templates. */
export function useUserTemplates(authorId: string | undefined) {
  return useQuery({
    queryKey: ["user-templates", authorId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<UserTemplatesListResponse>(
        `/v1/user-templates?author_id=${authorId}`,
        token
      );
    },
    enabled: !!authorId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Create a new user template. */
export function useCreateUserTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      author_id: string;
      name: string;
      description?: string;
      template_content: string;
      category?: string;
    }) => {
      const token = await getToken();
      return apiCall<UserTemplate>(
        "/v1/user-templates",
        payload as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-templates"] });
    },
  });
}

/** Update a user template. */
export function useUpdateUserTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      templateId,
      ...data
    }: {
      templateId: string;
      name?: string;
      description?: string;
      template_content?: string;
      category?: string;
      is_favorite?: boolean;
    }) => {
      const token = await getToken();
      return apiPatch<UserTemplate>(
        `/v1/user-templates/${templateId}`,
        data as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-templates"] });
    },
  });
}

/** Delete a user template. */
export function useDeleteUserTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const token = await getToken();
      return apiDelete<{ success: boolean }>(
        `/v1/user-templates/${templateId}`,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-templates"] });
    },
  });
}

/** Duplicate a system or user template. */
export function useDuplicateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      templateId,
      authorId,
      sourceType,
    }: {
      templateId: string | number;
      authorId: string;
      sourceType: "system" | "user";
    }) => {
      const token = await getToken();
      return apiCall<UserTemplate>(
        `/v1/user-templates/duplicate/${templateId}`,
        { author_id: authorId, source_type: sourceType },
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-templates"] });
    },
  });
}
