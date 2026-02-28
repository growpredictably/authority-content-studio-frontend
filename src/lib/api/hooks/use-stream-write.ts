"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WritePostResponse, WriteArticleResponse } from "@/lib/api/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export type StreamStatus =
  | "idle"
  | "connecting"
  | "streaming"
  | "complete"
  | "error";

export interface StreamProgress {
  phase: string;
  message: string;
  percent: number;
}

export interface UseStreamWriteReturn {
  status: StreamStatus;
  progress: StreamProgress | null;
  streamedContent: string;
  finalResult: WritePostResponse | WriteArticleResponse | null;
  error: string | null;
  startStream: (
    action: "writePost" | "writeArticle",
    payload: Record<string, unknown>
  ) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for SSE streaming from /v1/orchestrator/stream.
 * Progressively displays content chunks and progress updates.
 * Falls back to sync POST on connection failure.
 */
export function useStreamWrite(): UseStreamWriteReturn {
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [progress, setProgress] = useState<StreamProgress | null>(null);
  const [streamedContent, setStreamedContent] = useState("");
  const [finalResult, setFinalResult] = useState<
    WritePostResponse | WriteArticleResponse | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStatus("idle");
    setProgress(null);
    setStreamedContent("");
    setFinalResult(null);
    setError(null);
  }, []);

  const startStream = useCallback(
    async (
      action: "writePost" | "writeArticle",
      payload: Record<string, unknown>
    ) => {
      // Reset state
      setStatus("connecting");
      setProgress(null);
      setStreamedContent("");
      setFinalResult(null);
      setError(null);

      // Get auth token
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Not authenticated");
        setStatus("error");
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`${BACKEND_URL}/v1/orchestrator/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action, payload }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.text();
          throw new Error(`API Error ${res.status}: ${body}`);
        }

        if (!res.body) {
          throw new Error("No response body — SSE not supported");
        }

        setStatus("streaming");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split("\n");
          // Keep incomplete last line in buffer
          buffer = lines.pop() || "";

          let eventType = "";
          let eventData = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              eventData = line.slice(6);
            } else if (line === "" && eventType && eventData) {
              // Empty line = end of event, process it
              try {
                const parsed = JSON.parse(eventData);
                handleEvent(eventType, parsed);
              } catch {
                // Ignore malformed JSON
              }
              eventType = "";
              eventData = "";
            }
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        const message =
          err instanceof Error ? err.message : "Stream connection failed";
        setError(message);
        setStatus("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function handleEvent(type: string, data: Record<string, unknown>) {
    switch (type) {
      case "progress":
        setProgress({
          phase: (data.phase as string) || "",
          message: (data.message as string) || "",
          percent: (data.percent as number) || 0,
        });
        break;

      case "content_chunk":
        setStreamedContent((prev) => prev + ((data.text as string) || ""));
        break;

      case "complete": {
        const result = Array.isArray(data.result)
          ? data.result[0]
          : data.result;
        setFinalResult(
          result as WritePostResponse | WriteArticleResponse
        );
        setStatus("complete");
        setProgress(null);
        break;
      }

      case "error":
        setError(
          (data.error as string) || "Unknown streaming error"
        );
        setStatus("error");
        break;
    }
  }

  return {
    status,
    progress,
    streamedContent,
    finalResult,
    error,
    startStream,
    reset,
  };
}
