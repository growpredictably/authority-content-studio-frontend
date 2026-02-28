"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { FirefliesTranscription } from "@/lib/api/types";

// ─── Filter types ───────────────────────────────────────────

export interface TranscriptionFilters {
  search: string;
  meetingType: string;
  trainingStatus: "all" | "trained" | "not_trained";
  sortField: string;
  sortDesc: boolean;
  page: number;
  pageSize: number;
}

export const DEFAULT_FILTERS: TranscriptionFilters = {
  search: "",
  meetingType: "All",
  trainingStatus: "all",
  sortField: "meeting_date",
  sortDesc: true,
  page: 1,
  pageSize: 25,
};

// ─── List transcriptions (paginated, filtered, sorted) ──────

export function useFirefliesTranscriptions(
  userId: string | undefined,
  filters: TranscriptionFilters = DEFAULT_FILTERS,
  trainedIds?: Set<number>
) {
  return useQuery({
    queryKey: [
      "fireflies-transcriptions",
      userId,
      filters,
      trainedIds ? [...trainedIds].sort() : null,
    ],
    queryFn: async () => {
      const supabase = createClient();
      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;

      let query = supabase
        .from("fireflies_transcriptions")
        .select("*", { count: "exact" })
        .eq("user_id", userId!);

      // Meeting type filter
      if (filters.meetingType === "Untyped") {
        query = query.is("meeting_type", null);
      } else if (filters.meetingType !== "All") {
        query = query.eq("meeting_type", filters.meetingType);
      }

      // Search filter
      if (filters.search.trim()) {
        query = query.ilike("title", `%${filters.search.trim()}%`);
      }

      // Training status filter
      if (filters.trainingStatus === "trained") {
        if (!trainedIds || trainedIds.size === 0) {
          return { transcriptions: [] as FirefliesTranscription[], total: 0 };
        }
        query = query.in("id", [...trainedIds]);
      } else if (
        filters.trainingStatus === "not_trained" &&
        trainedIds &&
        trainedIds.size > 0
      ) {
        query = query.not("id", "in", `(${[...trainedIds].join(",")})`);
      }

      // Sort — "words" is computed client-side, so fall back to meeting_date
      if (filters.sortField === "words") {
        query = query.order("meeting_date", { ascending: false });
      } else {
        query = query.order(filters.sortField, {
          ascending: !filters.sortDesc,
        });
      }

      // Paginate
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        transcriptions: (data || []) as FirefliesTranscription[],
        total: count ?? 0,
      };
    },
    enabled:
      !!userId &&
      (filters.trainingStatus === "all" || trainedIds !== undefined),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

// ─── Meeting type counts (for filter pills) ─────────────────

export function useMeetingTypeCounts(userId: string | undefined) {
  return useQuery({
    queryKey: ["fireflies-meeting-type-counts", userId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("fireflies_transcriptions")
        .select("meeting_type")
        .eq("user_id", userId!);

      if (error) throw error;

      const counts: Record<string, number> = {};
      let total = 0;
      let untypedCount = 0;

      for (const row of data || []) {
        const mt = (row as { meeting_type: string | null }).meeting_type;
        if (mt === null || mt === undefined) {
          untypedCount++;
        } else {
          counts[mt] = (counts[mt] || 0) + 1;
        }
        total++;
      }
      return { counts, total, untypedCount };
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

// ─── Training status (Set of trained transcription IDs) ─────

export function useTrainingStatus(authorId: string | undefined) {
  return useQuery({
    queryKey: ["transcription-training-status", authorId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("transcription_training_usage")
        .select("transcription_id")
        .eq("author_id", authorId!);

      if (error) throw error;

      return new Set<number>(
        (data || []).map(
          (r: { transcription_id: number }) => r.transcription_id
        )
      );
    },
    enabled: !!authorId,
    staleTime: 60_000,
  });
}

// ─── Mutations ──────────────────────────────────────────────

/** Update meeting_type for one or more transcriptions (null to clear). */
export function useUpdateMeetingType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      meetingType,
    }: {
      ids: number[];
      meetingType: string | null;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("fireflies_transcriptions")
        .update({ meeting_type: meetingType })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fireflies-transcriptions"] });
      qc.invalidateQueries({ queryKey: ["fireflies-meeting-type-counts"] });
    },
  });
}

/** Delete one or more transcriptions. */
export function useDeleteTranscriptions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("fireflies_transcriptions")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fireflies-transcriptions"] });
      qc.invalidateQueries({ queryKey: ["fireflies-meeting-type-counts"] });
    },
  });
}

/** Update one transcription's editable fields. */
export function useUpdateTranscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: Record<string, unknown>;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("fireflies_transcriptions")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fireflies-transcriptions"] });
      qc.invalidateQueries({ queryKey: ["fireflies-meeting-type-counts"] });
    },
  });
}

/** Record training usage for one or more transcriptions. */
export function useMarkAsTrained() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      transcriptionIds,
      authorId,
      userId,
    }: {
      transcriptionIds: number[];
      authorId: string;
      userId: string;
    }) => {
      const supabase = createClient();
      const rows = transcriptionIds.map((tid) => ({
        transcription_id: tid,
        author_id: authorId,
        user_id: userId,
        trained_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from("transcription_training_usage")
        .upsert(rows, { onConflict: "transcription_id,author_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transcription-training-status"] });
    },
  });
}

// ─── Lightweight transcript list (for dropdowns) ──────────

export function useTranscriptionList(userId: string | undefined) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["transcription-list", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fireflies_transcriptions")
        .select("id, title, meeting_date")
        .eq("user_id", userId!)
        .order("meeting_date", { ascending: false });
      if (error) throw error;
      return data as {
        id: number;
        title: string;
        meeting_date: string | null;
      }[];
    },
  });
}
