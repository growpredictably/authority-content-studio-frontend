"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiCall, apiPatch, apiDelete } from "@/lib/api/client";

interface AuthorSummary {
  id: string;
  user_id: string;
  name: string;
  brand_id?: string;
  archetype?: string;
  archetype_description?: string;
  status?: string;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AuthorsListResponse {
  authors: AuthorSummary[];
  total: number;
}

interface AuthorCreateInput {
  name: string;
  brand_id: string;
  archetype?: string;
  archetype_description?: string;
  is_primary?: boolean;
}

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

export function useAuthors() {
  return useQuery({
    queryKey: ["authors"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<AuthorsListResponse>("/v1/authors", token);
    },
    staleTime: 5 * 60_000,
  });
}

export function useCreateAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AuthorCreateInput) => {
      const token = await getToken();
      return apiCall<{ success: boolean; author: unknown; message: string }>(
        "/v1/authors",
        data as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["author"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}

export function useUpdateAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      authorId,
      updates,
    }: {
      authorId: string;
      updates: Record<string, unknown>;
    }) => {
      const token = await getToken();
      return apiPatch<{ success: boolean; author: unknown }>(
        `/v1/authors/${authorId}`,
        updates,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["author"] });
      queryClient.invalidateQueries({ queryKey: ["voice-profile"] });
    },
  });
}

export function useSetPrimaryAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (authorId: string) => {
      const token = await getToken();
      return apiPatch<{ success: boolean; author_id: string; message: string }>(
        `/v1/authors/${authorId}/primary`,
        {},
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["author"] });
      queryClient.invalidateQueries({ queryKey: ["voice-profile"] });
    },
  });
}

export function useDeleteAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (authorId: string) => {
      const token = await getToken();
      return apiDelete<{ success: boolean; author_id: string }>(
        `/v1/authors/${authorId}`,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["author"] });
    },
  });
}
