"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useDraftRetentionPolicy } from "./use-app-settings";
import type { DraftSession } from "@/lib/api/types";

// ─── Query Hooks ─────────────────────────────────────────────

/** List in-progress content_sessions for a user (Drafts page). */
export function useDrafts(userId: string | undefined) {
  return useQuery({
    queryKey: ["drafts", userId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("content_sessions")
        .select(
          `
          id, session_record_id, current_phase, content_strategy, content_type,
          research_strategy, youtube_url, author_id, target_icp, updated_at,
          created_at, all_angles, selected_angle, full_context, approved_context,
          outline_data, full_outline_response, status,
          strategy, title, outline, written_content, final_content, word_count
        `
        )
        .eq("user_id", userId!)
        .eq("status", "in_progress")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as DraftSession[];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}

/** Count in-progress sessions with no meaningful progress (for cleanup UI). */
export function useEmptyDraftsCount(userId: string | undefined) {
  return useQuery({
    queryKey: ["empty-drafts-count", userId],
    queryFn: async () => {
      const supabase = createClient();
      const { count, error } = await supabase
        .from("content_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId!)
        .eq("status", "in_progress")
        .is("selected_angle", null)
        .is("outline_data", null)
        .is("approved_context", null);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId,
    staleTime: 2 * 60_000,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────

/** Archive a draft (set status to 'abandoned'). */
export function useArchiveDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("content_sessions")
        .update({ status: "abandoned" })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      queryClient.invalidateQueries({ queryKey: ["empty-drafts-count"] });
    },
  });
}

/** Delete a single draft session. */
export function useDeleteDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("content_sessions")
        .delete()
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      queryClient.invalidateQueries({ queryKey: ["empty-drafts-count"] });
    },
  });
}

/** Bulk delete draft sessions by IDs. */
export function useBulkDeleteDrafts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionIds: string[]) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("content_sessions")
        .delete()
        .in("id", sessionIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      queryClient.invalidateQueries({ queryKey: ["empty-drafts-count"] });
    },
  });
}

// ─── Retention Cleanup ──────────────────────────────────────

/** Runs draft retention cleanup once on mount based on admin-configured policy. */
export function useDraftRetentionCleanup(userId: string | undefined) {
  const { data: policy } = useDraftRetentionPolicy();
  const queryClient = useQueryClient();
  const didRun = useRef(false);

  useEffect(() => {
    if (!userId || !policy || !policy.auto_cleanup_enabled || didRun.current)
      return;
    didRun.current = true;

    (async () => {
      const supabase = createClient();
      let didDelete = false;

      // 1. Delete expired drafts (older than max_age_days)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - policy.max_age_days);

      const { data: expired } = await supabase
        .from("content_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "in_progress")
        .lt("updated_at", cutoff.toISOString());

      if (expired && expired.length > 0) {
        await supabase
          .from("content_sessions")
          .delete()
          .in("id", expired.map((r) => r.id));
        didDelete = true;
      }

      // 2. Delete excess drafts (over max_drafts_per_user)
      const { data: allDrafts } = await supabase
        .from("content_sessions")
        .select("id, selected_angle, outline_data, approved_context, updated_at")
        .eq("user_id", userId)
        .eq("status", "in_progress")
        .order("updated_at", { ascending: false });

      if (allDrafts && allDrafts.length > policy.max_drafts_per_user) {
        // Sort: sessions without meaningful progress first, then oldest
        const sorted = [...allDrafts].sort((a, b) => {
          const aHasProgress =
            a.selected_angle != null ||
            a.outline_data != null ||
            a.approved_context != null;
          const bHasProgress =
            b.selected_angle != null ||
            b.outline_data != null ||
            b.approved_context != null;

          // No progress first
          if (aHasProgress !== bHasProgress)
            return aHasProgress ? 1 : -1;
          // Then oldest first
          return (
            new Date(a.updated_at).getTime() -
            new Date(b.updated_at).getTime()
          );
        });

        const toDelete = sorted
          .slice(policy.max_drafts_per_user)
          .map((r) => r.id);

        if (toDelete.length > 0) {
          await supabase
            .from("content_sessions")
            .delete()
            .in("id", toDelete);
          didDelete = true;
        }
      }

      if (didDelete) {
        queryClient.invalidateQueries({ queryKey: ["drafts"] });
        queryClient.invalidateQueries({ queryKey: ["empty-drafts-count"] });
      }
    })();
  }, [userId, policy, queryClient]);
}
