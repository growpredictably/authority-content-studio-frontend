"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiCall, apiPatch, apiDelete } from "@/lib/api/client";
import type {
  BrandsListResponse,
  BrandCreateRequest,
  BrandUpdateRequest,
} from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/** Fetch all brands for the current user, organized into hierarchy. */
export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<BrandsListResponse>("/v1/brands", token);
    },
    staleTime: 5 * 60_000,
  });
}

/** Create a new company or individual brand. */
export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BrandCreateRequest) => {
      const token = await getToken();
      return apiCall<{ success: boolean; brand: unknown; author: unknown }>(
        "/v1/brands",
        data as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["author"] });
    },
  });
}

/** Update a brand's fields. */
export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      brandId,
      updates,
    }: {
      brandId: string;
      updates: BrandUpdateRequest;
    }) => {
      const token = await getToken();
      return apiPatch<{ success: boolean; brand: unknown }>(
        `/v1/brands/${brandId}`,
        updates as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}

/** Delete a brand. */
export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (brandId: string) => {
      const token = await getToken();
      return apiDelete<{ success: boolean; brand_id: string }>(
        `/v1/brands/${brandId}`,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}
