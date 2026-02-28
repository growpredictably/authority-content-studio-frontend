"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet } from "@/lib/api/client";

interface AuthorSummary {
  id: string;
  user_id: string;
  name: string;
  brand_id?: string;
  status?: string;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AuthorsListResponse {
  authors: AuthorSummary[];
  total: number;
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
    queryKey: ["authors-list"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<AuthorsListResponse>("/v1/authors", token);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSetPrimaryAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (authorId: string) => {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/authors/${authorId}/primary`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to set primary author");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors-list"] });
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/authors/${authorId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete author");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors-list"] });
      queryClient.invalidateQueries({ queryKey: ["author"] });
    },
  });
}
