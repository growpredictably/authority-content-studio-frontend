"use client";

import { useEffect, useRef } from "react";
import { usePipeline } from "./pipeline-context";
import { useAuthor } from "@/hooks/use-author";
import { useSaveSession } from "@/lib/api/hooks/use-content-sessions";

/**
 * Auto-saves pipeline state to content_sessions at key transitions.
 * Uses sessionId from pipeline state to upsert (update existing row).
 * Call this hook from any pipeline page to enable progressive saving.
 */
export function useAutoSave() {
  const { state, setSessionId } = usePipeline();
  const { author } = useAuthor();
  const saveSession = useSaveSession();

  // Track what we've already saved to avoid duplicate writes
  const savedAnglesCount = useRef(0);
  const savedAngleId = useRef<string | null>(null);
  const savedOutline = useRef(false);
  const savedWritten = useRef(false);

  // Reset tracking when session changes
  useEffect(() => {
    savedAnglesCount.current = 0;
    savedAngleId.current = null;
    savedOutline.current = false;
    savedWritten.current = false;
  }, [state.sessionId]);

  // Save after angles are generated
  useEffect(() => {
    if (
      !state.angles.length ||
      !author ||
      state.angles.length === savedAnglesCount.current ||
      saveSession.isPending
    )
      return;

    savedAnglesCount.current = state.angles.length;

    saveSession.mutate(
      {
        id: state.sessionId || undefined,
        author_id: author.id,
        user_id: author.user_id,
        strategy: state.strategy ?? undefined,
        content_strategy: state.strategy ?? undefined,
        content_type: state.contentType,
        current_phase: "angles",
        all_angles: state.angles as unknown as Record<string, unknown>[],
        youtube_url:
          state.strategy === "YouTube" ? state.rawInput : undefined,
        raw_input: state.rawInput || undefined,
        session_record_id: state.sessionRecordId || undefined,
        status: "in_progress",
      },
      {
        onSuccess: (data) => {
          // Capture session ID from the first save so subsequent saves upsert
          if (!state.sessionId && data?.id) {
            setSessionId(data.id);
          }
        },
      }
    );
  }, [state.angles.length]);

  // Save after angle is selected
  useEffect(() => {
    if (
      !state.selectedAngle ||
      !state.sessionId ||
      state.selectedAngle.title === savedAngleId.current ||
      saveSession.isPending
    )
      return;

    savedAngleId.current = state.selectedAngle.title;

    saveSession.mutate({
      id: state.sessionId,
      user_id: author?.user_id ?? "",
      selected_angle: state.selectedAngle as unknown as Record<
        string,
        unknown
      >,
      current_phase: "refine",
      title: state.selectedAngle.title,
      status: "in_progress",
    });
  }, [state.selectedAngle?.title]);

  // Save after outline is generated
  useEffect(() => {
    if (
      !state.outline ||
      !state.sessionId ||
      savedOutline.current ||
      saveSession.isPending
    )
      return;

    savedOutline.current = true;

    saveSession.mutate({
      id: state.sessionId,
      user_id: author?.user_id ?? "",
      outline: state.outline as unknown as Record<string, unknown>,
      current_phase: "outline",
      status: "in_progress",
    });
  }, [!!state.outline]);

  // Save after written content is generated
  useEffect(() => {
    if (
      !state.writtenContent ||
      !state.sessionId ||
      savedWritten.current ||
      saveSession.isPending
    )
      return;

    savedWritten.current = true;

    saveSession.mutate({
      id: state.sessionId,
      user_id: author?.user_id ?? "",
      written_content: state.writtenContent as unknown as Record<
        string,
        unknown
      >,
      current_phase: "writing",
      status: "in_progress",
    });
  }, [!!state.writtenContent]);
}
