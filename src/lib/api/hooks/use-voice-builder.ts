"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiCall, apiGet } from "@/lib/api/client";
import type {
  VoiceMiningRequest,
  VoiceMiningResponse,
  MiningJobStatus,
  VoiceIngestData,
  VoiceIngestResponse,
  VoiceIngestConflictResponse,
  ConflictResolution,
} from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

// ─── Transcription Hook ─────────────────────────────────────

export function useTranscribeAudio() {
  return useMutation({
    mutationFn: async ({
      audioBlob,
      userId,
    }: {
      audioBlob: Blob;
      userId: string;
    }) => {
      const token = await getToken();
      const supabase = createClient();

      // 1. Upload audio to Supabase Storage
      const fileName = `${userId}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("voice-recordings")
        .upload(fileName, audioBlob, {
          contentType: "audio/webm",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // 2. Get the public URL
      const { data: urlData } = supabase.storage
        .from("voice-recordings")
        .getPublicUrl(fileName);

      const audioUrl = urlData.publicUrl;

      // 3. Call transcription endpoint
      const trackingId = `voice_${userId.slice(0, 8)}_${Date.now()}`;
      const result = await apiCall<{
        tracking_id: string;
        status: string;
        transcript: string;
        duration_seconds?: number;
      }>("/v1/transcription/transcribe", { audio_url: audioUrl, tracking_id: trackingId }, token);

      return result;
    },
  });
}

// ─── Mining Hooks ────────────────────────────────────────────

export function useStartMining() {
  return useMutation({
    mutationFn: async (request: VoiceMiningRequest) => {
      const token = await getToken();
      return apiCall<VoiceMiningResponse>(
        "/v1/voice-builder/mine",
        request as unknown as Record<string, unknown>,
        token
      );
    },
  });
}

export function useMiningStatus(
  jobId: string | undefined,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["mining-job", jobId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<MiningJobStatus>(
        `/v1/voice-builder/mine/${jobId}`,
        token
      );
    },
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 2000;
    },
  });
}

// ─── Ingest Hooks ────────────────────────────────────────────

export function useIngestDna() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      data: VoiceIngestData;
      author_id: string;
      user_id: string;
      metadata?: Record<string, unknown>;
    }) => {
      const token = await getToken();
      return apiCall<VoiceIngestResponse | VoiceIngestConflictResponse>(
        "/v1/voice-builder/ingest",
        payload as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: (data) => {
      if ("success" in data && data.success) {
        queryClient.invalidateQueries({ queryKey: ["authority-packets"] });
        queryClient.invalidateQueries({ queryKey: ["authority-score"] });
        queryClient.invalidateQueries({ queryKey: ["gap-analysis"] });
      }
    },
  });
}

// ─── Voice Profile Hooks ─────────────────────────────────────

/** Fetch the voice profile (tone, stories, etc.) from authors_dna. */
export function useVoiceProfile(authorId: string | undefined) {
  return useQuery({
    queryKey: ["voice-profile", authorId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("authors_dna")
        .select(
          "id, name, brand_id, user_id, archetype, archetype_description, status, is_primary, updated_at, tone, stories, perspectives, quotes, knowledge, experience, preferences, frameworks"
        )
        .eq("id", authorId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!authorId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch all authors with DNA columns for the profiles grid. */
export function useAllAuthorsWithDna() {
  return useQuery({
    queryKey: ["all-authors-dna"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch user's brands
      const { data: brands } = await supabase
        .from("user_brands")
        .select("id, name, brand_color")
        .eq("user_id", user.id);

      // Fetch all authors with DNA columns
      const { data: authors, error } = await supabase
        .from("authors_dna")
        .select(
          "id, name, brand_id, user_id, archetype, archetype_description, is_primary, status, updated_at, tone, quotes, stories, knowledge, experience, perspectives, preferences, frameworks"
        )
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false })
        .order("name");

      if (error) throw error;

      // Merge brand info
      const brandMap = new Map(
        (brands || []).map((b) => [b.id, b])
      );
      return (authors || []).map((a) => ({
        ...a,
        brand: brandMap.get(a.brand_id) || {
          id: a.brand_id,
          name: "Unknown",
          brand_color: null,
        },
      }));
    },
    staleTime: 2 * 60_000,
  });
}

/** Update a single DNA section (e.g. stories, tone) directly. */
export function useUpdateDnaSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      author_id: string;
      section_key: string;
      data: unknown;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("authors_dna")
        .update({ [payload.section_key]: payload.data })
        .eq("id", payload.author_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-profile"] });
    },
  });
}

/** Trigger a full voice re-synthesis (or partial with exclude). */
export function useResynthesizeVoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      author_id: string;
      user_id: string;
      exclude?: string[];
    }) => {
      const token = await getToken();
      return apiCall<{ success: boolean; tracking_id: string }>(
        "/v1/voice-synthesizer",
        payload as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-profile"] });
    },
  });
}

export function useResolveConflicts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      author_id: string;
      user_id: string;
      data: VoiceIngestData;
      conflict_resolutions: ConflictResolution[];
      metadata?: Record<string, unknown>;
    }) => {
      const token = await getToken();
      return apiCall<VoiceIngestResponse>(
        "/v1/voice-builder/ingest/resolve-conflicts",
        payload as unknown as Record<string, unknown>,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authority-packets"] });
      queryClient.invalidateQueries({ queryKey: ["authority-score"] });
      queryClient.invalidateQueries({ queryKey: ["gap-analysis"] });
    },
  });
}
