"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePipeline } from "@/lib/content-pipeline/pipeline-context";
import { useAutoSave } from "@/lib/content-pipeline/use-auto-save";
import { useAuthor } from "@/hooks/use-author";
import {
  useWritePost,
  useWriteArticle,
} from "@/lib/api/hooks/use-content-pipeline";
import { WrittenContent } from "@/components/content-pipeline/written-content";
import { ProgressDisplay } from "@/components/content-pipeline/progress-display";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, PenTool } from "lucide-react";
import { toast } from "sonner";

export default function WritePage() {
  const router = useRouter();
  const { author } = useAuthor();
  const { state, setWrittenContent } = usePipeline();
  const writePost = useWritePost();
  const writeArticle = useWriteArticle();
  useAutoSave();
  const [hasTriggered, setHasTriggered] = useState(false);
  const [progressTrackingId, setProgressTrackingId] = useState<string | null>(
    null
  );

  const isPost = state.contentType === "linkedin_post";
  const isWriting = writePost.isPending || writeArticle.isPending;

  // Guard: redirect if no outline
  useEffect(() => {
    if (!state.outline) {
      router.replace("/content/outline");
    }
  }, [state.outline, router]);

  // Auto-trigger writing
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

    const basePayload = {
      user_id: author.user_id,
      author_id: author.id,
      author_name: author.name,
      brand_id: author.brand_id || "",
      content_type: state.contentType,
      selected_angle: state.selectedAngle,
      outline: state.outline,
      selected_hook: state.selectedHook,
      context: state.anglesContext || {},
      session_record_id: state.sessionRecordId || "",
      archetype: author.archetype || "",
      archetype_description: author.archetype_description || "",
    };

    const mutation = isPost ? writePost : writeArticle;

    mutation.mutate(basePayload, {
      onSuccess: (data) => {
        setProgressTrackingId(null);
        setWrittenContent(data);
        toast.success(isPost ? "Post written" : "Article written");
      },
      onError: (err) => {
        setProgressTrackingId(null);
        toast.error(
          err instanceof Error ? err.message : "Failed to write content"
        );
      },
    });
  }, [
    author,
    state.outline,
    state.writtenContent,
    state.selectedAngle,
    state.selectedHook,
    state.contentType,
    state.anglesContext,
    state.sessionRecordId,
    hasTriggered,
    isWriting,
    isPost,
    writePost,
    writeArticle,
    setWrittenContent,
  ]);

  if (!state.outline) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <PenTool className="h-5 w-5" />
        <h2 className="text-xl font-semibold">
          {isPost ? "Write Post" : "Write Article"}
        </h2>
      </div>

      {isWriting && (
        <div className="space-y-4">
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
          <ProgressDisplay
            trackingId={progressTrackingId}
            label={isPost ? "Writing Post" : "Writing Article"}
          />
        </div>
      )}

      {state.writtenContent && <WrittenContent />}
    </div>
  );
}
