"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiCall } from "@/lib/api/client";
import type { BrandFramework, BatchJobResponse } from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/** Extract a framework from a Fireflies transcript via the backend LLM endpoint. */
export function useExtractFramework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      transcriptionId: number;
      authorId: string;
      frameworkName?: string;
      useBatch?: boolean;
    }) => {
      const token = await getToken();
      return apiCall<BrandFramework | BatchJobResponse>(
        "/v1/frameworks/extract-from-transcript",
        {
          transcription_id: payload.transcriptionId,
          author_id: payload.authorId,
          framework_name: payload.frameworkName || undefined,
          use_batch: payload.useBatch ?? false,
        },
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frameworks"] });
    },
  });
}

/** Enrich an existing framework with new information from a Fireflies transcript. */
export function useEnrichFramework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      frameworkId: string;
      transcriptionId: number;
      authorId: string;
      useBatch?: boolean;
      fieldsToEnhance?: string[];
    }) => {
      const token = await getToken();
      return apiCall<BrandFramework | BatchJobResponse>(
        `/v1/frameworks/${payload.frameworkId}/enrich-from-transcript`,
        {
          transcription_id: payload.transcriptionId,
          author_id: payload.authorId,
          use_batch: payload.useBatch ?? false,
          fields_to_enhance: payload.fieldsToEnhance ?? null,
        },
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frameworks"] });
    },
  });
}
