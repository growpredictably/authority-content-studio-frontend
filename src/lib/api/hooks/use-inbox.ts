"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiCall } from "@/lib/api/client";
import type { InboxListResponse } from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

export function useInbox(authorId: string | undefined) {
  return useQuery({
    queryKey: ["brain-inbox", authorId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<InboxListResponse>(
        `/external-knowledge/inbox/${authorId}?status=Draft`,
        token
      );
    },
    enabled: !!authorId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useApproveInboxItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      inbox_item_id: string;
      user_id: string;
      author_id: string;
    }) => {
      const token = await getToken();
      return apiCall<{ success: boolean; message: string }>(
        "/external-knowledge",
        { ...payload, action: "approve" } as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brain-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["brain-library"] });
    },
  });
}

export function useRejectInboxItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      inbox_item_id: string;
      user_id: string;
      author_id: string;
    }) => {
      const token = await getToken();
      return apiCall<{ success: boolean; message: string }>(
        "/external-knowledge",
        { ...payload, action: "reject" } as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brain-inbox"] });
    },
  });
}
