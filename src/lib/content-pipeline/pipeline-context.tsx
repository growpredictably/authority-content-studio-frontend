"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  ContentStrategy,
  PipelineContentType,
  ContentAngle,
  AnglesContext,
  GenerateOutlineResponse,
  OutlineHook,
  WritePostResponse,
  WriteArticleResponse,
  DraftSession,
} from "@/lib/api/types";

export type PipelineStep = "angles" | "outline" | "write";

export interface PipelineState {
  // Persistence
  sessionId: string | null; // content_sessions.id (for upserts)

  // Step 1: Source
  strategy: ContentStrategy | null;
  contentType: PipelineContentType;
  rawInput: string;

  // Step 1 result
  angles: ContentAngle[];
  anglesContext: AnglesContext | null;
  sessionRecordId: string | null;
  trackingId: string | null;

  // Step 2: Outline
  selectedAngle: ContentAngle | null;
  outline: GenerateOutlineResponse | null;
  selectedHook: OutlineHook | null;
  selectedTemplate: string | null;

  // Step 3: Written content
  writtenContent: WritePostResponse | WriteArticleResponse | null;
}

interface PipelineContextValue {
  state: PipelineState;
  setSource: (
    strategy: ContentStrategy,
    contentType: PipelineContentType
  ) => void;
  setRawInput: (input: string) => void;
  setAnglesResult: (
    angles: ContentAngle[],
    context: AnglesContext,
    sessionId: string,
    trackingId?: string
  ) => void;
  selectAngle: (angle: ContentAngle) => void;
  setOutlineResult: (outline: GenerateOutlineResponse) => void;
  selectHook: (hook: OutlineHook) => void;
  selectTemplate: (template: string) => void;
  setWrittenContent: (
    content: WritePostResponse | WriteArticleResponse
  ) => void;
  setSessionId: (id: string) => void;
  restoreSession: (session: DraftSession) => void;
  reset: () => void;
  currentMaxStep: PipelineStep;
}

const initialState: PipelineState = {
  sessionId: null,
  strategy: null,
  contentType: "linkedin_post",
  rawInput: "",
  angles: [],
  anglesContext: null,
  sessionRecordId: null,
  trackingId: null,
  selectedAngle: null,
  outline: null,
  selectedHook: null,
  selectedTemplate: null,
  writtenContent: null,
};

const PipelineContext = createContext<PipelineContextValue | null>(null);

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PipelineState>(initialState);

  const setSource = useCallback(
    (strategy: ContentStrategy, contentType: PipelineContentType) => {
      setState((prev) => ({ ...prev, strategy, contentType }));
    },
    []
  );

  const setRawInput = useCallback((input: string) => {
    setState((prev) => ({ ...prev, rawInput: input }));
  }, []);

  const setAnglesResult = useCallback(
    (
      angles: ContentAngle[],
      context: AnglesContext,
      sessionId: string,
      trackingId?: string
    ) => {
      setState((prev) => ({
        ...prev,
        angles,
        anglesContext: context,
        sessionRecordId: sessionId,
        trackingId: trackingId ?? null,
      }));
    },
    []
  );

  const selectAngle = useCallback((angle: ContentAngle) => {
    setState((prev) => ({
      ...prev,
      selectedAngle: angle,
      outline: null,
      selectedHook: null,
      selectedTemplate: null,
      writtenContent: null,
    }));
  }, []);

  const setOutlineResult = useCallback(
    (outline: GenerateOutlineResponse) => {
      setState((prev) => ({ ...prev, outline }));
    },
    []
  );

  const selectHook = useCallback((hook: OutlineHook) => {
    setState((prev) => ({ ...prev, selectedHook: hook }));
  }, []);

  const selectTemplate = useCallback((template: string) => {
    setState((prev) => ({ ...prev, selectedTemplate: template }));
  }, []);

  const setWrittenContent = useCallback(
    (content: WritePostResponse | WriteArticleResponse) => {
      setState((prev) => ({ ...prev, writtenContent: content }));
    },
    []
  );

  const setSessionId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, sessionId: id }));
  }, []);

  const restoreSession = useCallback((session: DraftSession) => {
    setState({
      sessionId: session.id,
      strategy: ((session.content_strategy ||
        session.strategy ||
        null) as ContentStrategy | null),
      contentType: ((session.content_type ||
        "linkedin_post") as PipelineContentType),
      rawInput: session.youtube_url || "",
      angles: ((session.all_angles as unknown as ContentAngle[]) || []),
      anglesContext: ((session.approved_context ||
        session.full_context ||
        null) as unknown as AnglesContext | null),
      sessionRecordId: session.session_record_id || session.id,
      trackingId: null,
      selectedAngle: (session.selected_angle as unknown as ContentAngle | null) ?? null,
      outline: ((session.outline_data ||
        session.outline ||
        null) as unknown as GenerateOutlineResponse | null),
      selectedHook: null,
      selectedTemplate: null,
      writtenContent: (session.written_content as unknown as WritePostResponse | null) ??
        null,
    });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const currentMaxStep: PipelineStep = state.writtenContent
    ? "write"
    : state.selectedAngle
      ? "outline"
      : "angles";

  return (
    <PipelineContext.Provider
      value={{
        state,
        setSource,
        setRawInput,
        setAnglesResult,
        selectAngle,
        setOutlineResult,
        selectHook,
        selectTemplate,
        setWrittenContent,
        setSessionId,
        restoreSession,
        reset,
        currentMaxStep,
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipeline() {
  const ctx = useContext(PipelineContext);
  if (!ctx)
    throw new Error("usePipeline must be used within PipelineProvider");
  return ctx;
}
