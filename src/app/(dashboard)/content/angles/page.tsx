"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePipeline } from "@/lib/content-pipeline/pipeline-context";
import { useAutoSave } from "@/lib/content-pipeline/use-auto-save";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import { ICPSelector } from "@/components/content-pipeline/icp-selector";
import { useGetAngles } from "@/lib/api/hooks/use-content-pipeline";
import { useICPs } from "@/lib/api/hooks/use-icps";
import { useContentSessionDetail } from "@/lib/api/hooks/use-content-sessions";
import { StrategySelector } from "@/components/content-pipeline/strategy-selector";
import { SourceInput } from "@/components/content-pipeline/source-input";
import { AnglesResults } from "@/components/content-pipeline/angles-results";
import { ProgressDisplay } from "@/components/content-pipeline/progress-display";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ContentAngle, DraftSession } from "@/lib/api/types";

function AnglesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { author } = useAuthor();
  const { state, setAnglesResult, restoreSession } = usePipeline();
  const getAngles = useGetAngles();
  useAutoSave();
  const [progressTrackingId, setProgressTrackingId] = useState<string | null>(
    null
  );

  // Session restore from ?session= param
  const sessionParam = searchParams.get("session");
  const { data: sessionData, isLoading: sessionLoading } =
    useContentSessionDetail(sessionParam || undefined);
  const didRestore = useRef(false);

  useEffect(() => {
    if (!sessionData || didRestore.current) return;
    didRestore.current = true;

    // Restore pipeline state from the loaded session
    restoreSession(sessionData as unknown as DraftSession);

    // Navigate to the furthest stage
    const s = sessionData as unknown as DraftSession;
    if (s.written_content || s.final_content) {
      router.replace("/content/write");
    } else if (s.outline_data || s.outline) {
      router.replace("/content/outline");
    } else if (s.approved_context || s.selected_angle) {
      router.replace("/content/refine");
    }
    // If only angles, stay on this page
  }, [sessionData, restoreSession, router]);

  const { data: icpData } = useICPs(author?.id);
  const icps = icpData?.icps ?? [];

  function handleGenerate() {
    if (!author || !state.strategy) return;

    setProgressTrackingId(null);

    const selectedIcp = icps.find((i) => i.id === state.selectedIcpId);

    getAngles.mutate(
      {
        user_id: author.user_id,
        author_id: author.id,
        author_name: author.name,
        brand_id: author.brand_id || "",
        strategy: state.strategy,
        content_type: state.contentType,
        raw_input: state.rawInput,
        archetype: author.archetype || "",
        archetype_description: author.archetype_description || "",
        ...(selectedIcp ? { icp: selectedIcp.name } : {}),
      },
      {
        onSuccess: (data) => {
          setProgressTrackingId(null);
          setAnglesResult(
            data.selected_angles,
            data.context,
            data.session_record_id,
            data.tracking_id
          );
          toast.success(
            `${data.selected_angles.length} angles generated`
          );
        },
        onError: (err) => {
          setProgressTrackingId(null);
          toast.error(
            err instanceof Error ? err.message : "Failed to generate angles"
          );
        },
      }
    );
  }

  function handleAngleSelected(angle: ContentAngle) {
    router.push("/content/refine");
  }

  // Show loading while restoring a session
  if (sessionParam && sessionLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Restoring session...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Get Angles</h2>
        <AuthorSelector />
        <ICPSelector />
      </div>

      {!author ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Complete your DNA profile to use the content pipeline.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <StrategySelector />

          {state.strategy && (
            <SourceInput
              onSubmit={handleGenerate}
              isLoading={getAngles.isPending}
            />
          )}

          {getAngles.isPending && (
            <ProgressDisplay
              trackingId={progressTrackingId}
              label="Generating Angles"
            />
          )}

          {state.angles.length > 0 && !getAngles.isPending && (
            <AnglesResults onAngleSelected={handleAngleSelected} />
          )}
        </div>
      )}
    </div>
  );
}

export default function AnglesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AnglesPageInner />
    </Suspense>
  );
}
