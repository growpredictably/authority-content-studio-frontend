"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiPut, apiUpload } from "@/lib/api/client";
import type { ModelPreferences, AvailableModel } from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

// ─── Query Hooks ─────────────────────────────────────────────

/** Get model preferences for an author. */
export function useModelPreferences(authorId: string | undefined) {
  return useQuery({
    queryKey: ["model-preferences", authorId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ author_id: string; preferences: ModelPreferences }>(
        `/v1/models/preferences/${authorId}`,
        token
      );
    },
    enabled: !!authorId,
    staleTime: 5 * 60 * 1000,
  });
}

/** List all available models. */
export function useAvailableModels() {
  return useQuery({
    queryKey: ["available-models"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ models: AvailableModel[] }>(
        "/v1/models/available",
        token
      );
    },
    staleTime: 30 * 60 * 1000,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────

/** Update model preferences for an author. */
export function useUpdateModelPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      authorId,
      preferences,
    }: {
      authorId: string;
      preferences: Partial<ModelPreferences>;
    }) => {
      const token = await getToken();
      return apiPut<{ author_id: string; preferences: ModelPreferences }>(
        `/v1/models/preferences/${authorId}`,
        preferences as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-preferences"] });
    },
  });
}

export interface CsvUploadResult {
  rows_processed: number;
  rows_upserted: number;
  rows_deactivated: number;
  errors: string[];
}

/** Upload a CSV file to bulk upsert available models. */
export function useUploadModelsCsv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);
      return apiUpload<CsvUploadResult>(
        "/v1/models/upload-csv",
        formData,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-models"] });
      queryClient.invalidateQueries({ queryKey: ["model-preferences"] });
    },
  });
}
