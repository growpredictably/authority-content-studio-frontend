"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { orchestrate } from "@/lib/api/client";
import type {
  GetAnglesResponse,
  GenerateOutlineResponse,
  WritePostResponse,
  WriteArticleResponse,
  ProcessingStatus,
} from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/** Orchestrate getAngles action */
export function useGetAngles() {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const token = await getToken();
      return orchestrate<GetAnglesResponse>("getAngles", payload, token);
    },
  });
}

/** Orchestrate generateOutline action */
export function useGenerateOutline() {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const token = await getToken();
      return orchestrate<GenerateOutlineResponse>(
        "generateOutline",
        payload,
        token
      );
    },
  });
}

/** Orchestrate writePost action */
export function useWritePost() {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const token = await getToken();
      return orchestrate<WritePostResponse>("writePost", payload, token);
    },
  });
}

/** Orchestrate writeArticle action */
export function useWriteArticle() {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const token = await getToken();
      return orchestrate<WriteArticleResponse>("writeArticle", payload, token);
    },
  });
}

/** Poll processing_status table by tracking_id */
export function useProcessingStatus(trackingId: string | null) {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!trackingId) {
      setStatus(null);
      return;
    }

    const supabase = createClient();

    async function poll() {
      const { data, error } = await supabase
        .from("processing_status")
        .select("*")
        .eq("tracking_id", trackingId)
        .single();

      if (!error && data) {
        setStatus(data as ProcessingStatus);
        if (data.status === "completed" || data.status === "failed") {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }
    }

    poll();
    intervalRef.current = setInterval(poll, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [trackingId]);

  return status;
}
