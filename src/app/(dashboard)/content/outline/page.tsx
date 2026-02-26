"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePipeline } from "@/lib/content-pipeline/pipeline-context";
import { useAuthor } from "@/hooks/use-author";
import { useGenerateOutline } from "@/lib/api/hooks/use-content-pipeline";
import { OutlineViewer } from "@/components/content-pipeline/outline-viewer";
import { ProgressDisplay } from "@/components/content-pipeline/progress-display";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function OutlinePage() {
  const router = useRouter();
  const { author } = useAuthor();
  const { state, setOutlineResult } = usePipeline();
  const generateOutline = useGenerateOutline();
  const [hasTriggered, setHasTriggered] = useState(false);
  const [progressTrackingId, setProgressTrackingId] = useState<string | null>(
    null
  );

  // Guard: redirect if no selected angle
  useEffect(() => {
    if (!state.selectedAngle) {
      router.replace("/content/angles");
    }
  }, [state.selectedAngle, router]);

  // Auto-trigger outline generation
  useEffect(() => {
    if (
      !author ||
      !state.selectedAngle ||
      state.outline ||
      hasTriggered ||
      generateOutline.isPending
    )
      return;

    setHasTriggered(true);

    generateOutline.mutate(
      {
        user_id: author.user_id,
        author_id: author.id,
        author_name: author.name,
        brand_id: author.brand_id || "",
        content_type: state.contentType,
        selected_angle: state.selectedAngle,
        context: state.anglesContext || {},
        session_record_id: state.sessionRecordId || "",
        archetype: author.archetype || "",
        archetype_description: author.archetype_description || "",
      },
      {
        onSuccess: (data) => {
          setProgressTrackingId(null);
          setOutlineResult(data);
          toast.success("Outline generated");
        },
        onError: (err) => {
          setProgressTrackingId(null);
          toast.error(
            err instanceof Error ? err.message : "Failed to generate outline"
          );
        },
      }
    );
  }, [
    author,
    state.selectedAngle,
    state.outline,
    state.contentType,
    state.anglesContext,
    state.sessionRecordId,
    hasTriggered,
    generateOutline,
    setOutlineResult,
  ]);

  function handleWrite() {
    router.push("/content/write");
  }

  if (!state.selectedAngle) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Generate Outline</h2>
      </div>

      {generateOutline.isPending && (
        <div className="space-y-4">
          <Card>
            <CardContent className="py-8 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Building your outline...
              </p>
            </CardContent>
          </Card>
          <ProgressDisplay
            trackingId={progressTrackingId}
            label="Generating Outline"
          />
        </div>
      )}

      {state.outline && (
        <OutlineViewer
          onWrite={handleWrite}
          isWriting={false}
        />
      )}
    </div>
  );
}
