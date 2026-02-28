"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { useAuthor } from "@/hooks/use-author";
import {
  useStartMining,
  useMiningStatus,
  useIngestDna,
  useResolveConflicts,
  useTranscribeAudio,
} from "@/lib/api/hooks/use-voice-builder";
import {
  VoiceInputTabs,
  type VoiceSourceType,
} from "@/components/voice-builder/voice-input-tabs";
import { MiningProgress } from "@/components/voice-builder/mining-progress";
import {
  ExtractionReview,
  CommitSummary,
} from "@/components/voice-builder/extraction-review";
import { ConflictDialog } from "@/components/voice-builder/conflict-dialog";
import type {
  VoiceIngestData,
  IngestConflict,
  ConflictResolution,
  VoiceIngestConflictResponse,
} from "@/lib/api/types";

type Stage = "input" | "mining" | "review" | "committed";

export default function VoiceBuilderPage() {
  const { author } = useAuthor();
  const startMining = useStartMining();
  const transcribeAudio = useTranscribeAudio();
  const ingestDna = useIngestDna();
  const resolveConflicts = useResolveConflicts();

  const [stage, setStage] = useState<Stage>("input");
  const [jobId, setJobId] = useState<string>();
  const [extractedData, setExtractedData] = useState<VoiceIngestData | null>(
    null
  );
  const [conflicts, setConflicts] = useState<IngestConflict[]>([]);
  const [pendingIngestData, setPendingIngestData] =
    useState<VoiceIngestData | null>(null);
  const [committedCategories, setCommittedCategories] = useState<string[]>([]);

  const { data: miningJob } = useMiningStatus(
    jobId,
    stage === "mining"
  );

  // When mining completes, extract the data
  if (
    miningJob?.status === "completed" &&
    miningJob.result &&
    stage === "mining"
  ) {
    setExtractedData(miningJob.result as unknown as VoiceIngestData);
    setStage("review");
  }

  function handleSubmit(sourceType: VoiceSourceType, content: string) {
    if (!author) return;

    // URL scrape goes through the scraper first, then mine as text
    const mineSourceType = sourceType === "url" ? "text" : sourceType;

    startMining.mutate(
      {
        source_type: mineSourceType as "text" | "youtube" | "gdoc" | "gsheet",
        content,
        author_id: author.id,
        user_id: author.user_id,
        extraction_focus: ["stories", "beliefs", "patterns"],
      },
      {
        onSuccess: (res) => {
          setJobId(res.job_id);
          setStage("mining");
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to start mining"
          );
        },
      }
    );
  }

  function handleAudioRecorded(audioBlob: Blob) {
    if (!author) return;

    transcribeAudio.mutate(
      { audioBlob, userId: author.user_id },
      {
        onSuccess: (res) => {
          if (!res.transcript || res.transcript.trim().length < 20) {
            toast.error("Transcript too short. Please try recording again with more content.");
            return;
          }
          toast.success(`Transcribed ${res.duration_seconds ? Math.round(res.duration_seconds) + "s" : ""} of audio`);
          // Now mine the transcript
          handleSubmit("text", res.transcript);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Transcription failed"
          );
        },
      }
    );
  }

  function handleCommit(accepted: VoiceIngestData) {
    if (!author) return;

    ingestDna.mutate(
      {
        data: accepted,
        author_id: author.id,
        user_id: author.user_id,
      },
      {
        onSuccess: (res) => {
          if ("status" in res && res.status === "requires_confirmation") {
            const conflictRes = res as VoiceIngestConflictResponse;
            setConflicts(conflictRes.conflicts);
            setPendingIngestData(accepted);
          } else if ("success" in res && res.success) {
            setCommittedCategories(
              (res as { success: true; stats: { categories_updated: string[] } })
                .stats.categories_updated
            );
            setStage("committed");
            toast.success("Voice DNA updated successfully");
          }
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to commit DNA"
          );
        },
      }
    );
  }

  function handleResolveConflicts(resolutions: ConflictResolution[]) {
    if (!author || !pendingIngestData) return;

    resolveConflicts.mutate(
      {
        author_id: author.id,
        user_id: author.user_id,
        data: pendingIngestData,
        conflict_resolutions: resolutions,
      },
      {
        onSuccess: (res) => {
          setConflicts([]);
          setPendingIngestData(null);
          setCommittedCategories(res.stats.categories_updated);
          setStage("committed");
          toast.success("Conflicts resolved and DNA updated");
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to resolve conflicts"
          );
        },
      }
    );
  }

  function handleReset() {
    setStage("input");
    setJobId(undefined);
    setExtractedData(null);
    setConflicts([]);
    setPendingIngestData(null);
    setCommittedCategories([]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Mic className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Voice DNA</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {stage === "input" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Add Content to Mine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VoiceInputTabs
                  onSubmit={handleSubmit}
                  isSubmitting={startMining.isPending}
                  onAudioRecorded={handleAudioRecorded}
                  isTranscribing={transcribeAudio.isPending}
                />
              </CardContent>
            </Card>
          )}

          {stage === "mining" && miningJob && (
            <MiningProgress job={miningJob} />
          )}

          {stage === "review" && extractedData && (
            <ExtractionReview
              data={extractedData}
              onCommit={handleCommit}
              isCommitting={ingestDna.isPending}
            />
          )}

          {stage === "committed" && (
            <CommitSummary
              categories={committedCategories}
              onReset={handleReset}
            />
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Step
                n={1}
                title="Add content"
                desc="Paste text, a YouTube URL, or record audio"
                active={stage === "input"}
              />
              <Separator />
              <Step
                n={2}
                title="Mine DNA"
                desc="The system extracts stories, beliefs, and patterns"
                active={stage === "mining"}
              />
              <Separator />
              <Step
                n={3}
                title="Review & commit"
                desc="Accept, reject, or edit extractions before saving"
                active={stage === "review"}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <ConflictDialog
        conflicts={conflicts}
        open={conflicts.length > 0}
        onResolve={handleResolveConflicts}
        isResolving={resolveConflicts.isPending}
      />
    </div>
  );
}

function Step({
  n,
  title,
  desc,
  active,
}: {
  n: number;
  title: string;
  desc: string;
  active: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
          active
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {n}
      </div>
      <div>
        <p className="text-xs font-medium">{title}</p>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
