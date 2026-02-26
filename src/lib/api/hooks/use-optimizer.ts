"use client";

import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiUpload, apiCall, apiPut } from "@/lib/api/client";
import type {
  ParsedLinkedInProfile,
  SuggestResponse,
  DriftScanRequest,
} from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/** Upload and parse a LinkedIn PDF */
export function useParseLinkedInPdf() {
  return useMutation({
    mutationFn: async ({
      file,
      authorId,
      brandId,
    }: {
      file: File;
      authorId: string;
      brandId?: string;
    }) => {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("author_id", authorId);
      if (brandId) formData.append("brand_id", brandId);

      return apiUpload<ParsedLinkedInProfile>(
        "/v1/optimizer/parse-linkedin-pdf",
        formData,
        token
      );
    },
  });
}

/** Run a drift scan on a LinkedIn section */
export function useDriftScan() {
  return useMutation({
    mutationFn: async (request: DriftScanRequest) => {
      const token = await getToken();
      return apiCall<SuggestResponse>(
        "/v1/optimizer/suggest",
        request as unknown as Record<string, unknown>,
        token
      );
    },
  });
}

/** Approve a suggestion */
export function useApproveSuggestion() {
  return useMutation({
    mutationFn: async ({
      suggestionId,
      authorId,
      editedText,
    }: {
      suggestionId: string;
      authorId: string;
      editedText?: string;
    }) => {
      const token = await getToken();
      return apiCall<{ status: string; suggestion_id: string }>(
        "/v1/optimizer/approve",
        {
          suggestion_id: suggestionId,
          author_id: authorId,
          edited_text: editedText,
        },
        token
      );
    },
  });
}

/** Dismiss a suggestion */
export function useDismissSuggestion() {
  return useMutation({
    mutationFn: async ({
      suggestionId,
      authorId,
      reason,
    }: {
      suggestionId: string;
      authorId: string;
      reason?: string;
    }) => {
      const token = await getToken();
      return apiCall<{ status: string; suggestion_id: string }>(
        "/v1/optimizer/dismiss",
        {
          suggestion_id: suggestionId,
          author_id: authorId,
          reason,
        },
        token
      );
    },
  });
}

/** Update brand context mapping */
export function useUpdateBrandMapping() {
  return useMutation({
    mutationFn: async ({
      authorId,
      mapping,
    }: {
      authorId: string;
      mapping: Record<string, string>;
    }) => {
      const token = await getToken();
      return apiPut<{ status: string; mapping: Record<string, string> }>(
        "/v1/optimizer/brand-mapping",
        { author_id: authorId, mapping },
        token
      );
    },
  });
}
