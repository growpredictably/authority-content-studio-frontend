"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { GeneratedPost } from "@/lib/api/types";

// ─── Query Hooks ─────────────────────────────────────────────

/** List all generated posts for a user, with joined content_sessions metadata. */
export function useAllContent(userId: string | undefined) {
  return useQuery({
    queryKey: ["all-content", userId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("generated_posts")
        .select(
          `
          id, user_id, post_title, post_body, image_prompt, status, version,
          selected_hook, selected_template, created_at, updated_at, session_id,
          content_sessions (
            id, youtube_url, author_id, target_icp, selected_angle,
            content_strategy, content_type
          )
        `
        )
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Supabase returns FK joins as arrays; flatten to single object
      return (data ?? []).map((row) => ({
        ...row,
        content_sessions: Array.isArray(row.content_sessions)
          ? row.content_sessions[0] ?? undefined
          : row.content_sessions,
      })) as GeneratedPost[];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────

/** Insert a new row into generated_posts (called when user saves from editor). */
export function useSaveGeneratedPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      post: Omit<GeneratedPost, "id" | "created_at" | "updated_at" | "version" | "content_sessions">
    ) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("generated_posts")
        .insert(post)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-content"] });
    },
  });
}

/** Delete a single generated post. */
export function useDeleteGeneratedPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("generated_posts")
        .delete()
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-content"] });
    },
  });
}

/** Bulk delete generated posts by IDs. */
export function useBulkDeleteGeneratedPosts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postIds: string[]) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("generated_posts")
        .delete()
        .in("id", postIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-content"] });
    },
  });
}
