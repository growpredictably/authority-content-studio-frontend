"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribe to Supabase Realtime updates on the authors_dna table
 * for a specific author. Invalidates the voice-profile cache when
 * the row is updated (e.g. during synthesis).
 *
 * Auto-unsubscribes after 2 minutes to avoid stale connections.
 */
export function useRealtimeSynthesis(authorId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authorId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`dna-realtime-${authorId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "authors_dna",
          filter: `id=eq.${authorId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["voice-profile", authorId],
          });
          queryClient.invalidateQueries({
            queryKey: ["all-authors-dna"],
          });
          queryClient.invalidateQueries({
            queryKey: ["authority-score", authorId],
          });
        }
      )
      .subscribe();

    // Auto-timeout after 2 minutes
    const timeout = setTimeout(() => {
      supabase.removeChannel(channel);
    }, 120_000);

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [authorId, queryClient]);
}
