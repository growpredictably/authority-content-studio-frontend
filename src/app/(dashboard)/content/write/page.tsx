"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePipeline } from "@/lib/content-pipeline/pipeline-context";
import { useAutoSave } from "@/lib/content-pipeline/use-auto-save";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import {
  useWritePost,
  useWriteArticle,
} from "@/lib/api/hooks/use-content-pipeline";
import { useStreamWrite } from "@/lib/api/hooks/use-stream-write";
import { WrittenContent } from "@/components/content-pipeline/written-content";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, PenTool } from "lucide-react";
import { toast } from "sonner";

export default function WritePage() {
  const router = useRouter();
  const { author } = useAuthor();
  const { state, setWrittenContent } = usePipeline();
  const stream = useStreamWrite();
  const writePost = useWritePost();
  const writeArticle = useWriteArticle();
  useAutoSave();
  const [hasTriggered, setHasTriggered] = useState(false);

  const isPost = state.contentType === "linkedin_post";
  const isSyncWriting = writePost.isPending || writeArticle.isPending;
  const isStreaming =
    stream.status === "connecting" || stream.status === "streaming";
  const isWriting = isStreaming || isSyncWriting;

  // Guard: redirect if no outline
  useEffect(() => {
    if (!state.outline) {
      router.replace("/content/outline");
    }
  }, [state.outline, router]);

  // Handle stream completion — set written content when done
  const prevStreamStatus = useRef(stream.status);
  useEffect(() => {
    if (
      prevStreamStatus.current !== "complete" &&
      stream.status === "complete" &&
      stream.finalResult
    ) {
      setWrittenContent(stream.finalResult);
      toast.success(isPost ? "Post written" : "Article written");
    }
    prevStreamStatus.current = stream.status;
  }, [stream.status, stream.finalResult, setWrittenContent, isPost]);

  // Handle stream error — fall back to sync POST
  const hasAttemptedFallback = useRef(false);
  useEffect(() => {
    if (
      stream.status === "error" &&
      !hasAttemptedFallback.current &&
      !state.writtenContent &&
      author
    ) {
      hasAttemptedFallback.current = true;
      toast.info("Falling back to standard generation...");

      const basePayload = buildPayload();
      const mutation = isPost ? writePost : writeArticle;

      mutation.mutate(basePayload, {
        onSuccess: (data) => {
          setWrittenContent(data);
          toast.success(isPost ? "Post written" : "Article written");
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to write content"
          );
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream.status]);

  // Auto-trigger writing via SSE stream
  useEffect(() => {
    if (
      !author ||
      !state.outline ||
      state.writtenContent ||
      hasTriggered ||
      isWriting
    )
      return;

    setHasTriggered(true);

    const action = isPost ? "writePost" : "writeArticle";
    const payload = buildPayload();

    stream.startStream(action as "writePost" | "writeArticle", payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    author,
    state.outline,
    state.writtenContent,
    hasTriggered,
    isWriting,
    isPost,
  ]);

  function buildPayload(): Record<string, unknown> {
    if (!author) return {};
    return {
      user_id: author.user_id,
      author_id: author.id,
      author_name: author.name,
      brand_id: author.brand_id || "",
      content_type: state.contentType,
      selected_angle: state.selectedAngle,
      outline: state.editedOutline ?? state.outline,
      selected_hook: state.selectedHook,
      context: state.approvedContext || state.anglesContext || {},
      session_record_id: state.sessionRecordId || "",
      archetype: author.archetype || "",
      archetype_description: author.archetype_description || "",
      ...(state.selectedTemplate
        ? {
            selected_template: {
              template_name: state.selectedTemplate.template_name,
              template_content: state.selectedTemplate.template_content,
            },
          }
        : {}),
    };
  }

  if (!state.outline) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <PenTool className="h-5 w-5" />
        <h2 className="text-xl font-semibold">
          {isPost ? "Write Post" : "Write Article"}
        </h2>
        <AuthorSelector />
      </div>

      {/* Streaming progress UI */}
      {isStreaming && (
        <div className="space-y-4">
          {/* Progress bar */}
          {stream.progress && (
            <Card>
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    {stream.progress.phase}
                  </span>
                  <span className="text-muted-foreground">
                    {stream.progress.percent}%
                  </span>
                </div>
                <Progress value={stream.progress.percent} className="h-1.5" />
                <p className="text-xs text-muted-foreground">
                  {stream.progress.message}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Streamed content preview */}
          {stream.streamedContent ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm whitespace-pre-wrap font-sans leading-relaxed min-h-[200px]">
                  {stream.streamedContent}
                  <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stream.streamedContent.split(/\s+/).filter(Boolean).length}{" "}
                  words streaming...
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  {isPost
                    ? "Crafting your post..."
                    : "Writing your article..."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Sync fallback loading */}
      {isSyncWriting && !isStreaming && (
        <Card>
          <CardContent className="py-8 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-muted-foreground">
              {isPost ? "Crafting your post..." : "Writing your article..."}
            </p>
          </CardContent>
        </Card>
      )}

      {state.writtenContent && <WrittenContent />}
    </div>
  );
}
