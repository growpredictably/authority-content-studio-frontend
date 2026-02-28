"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Brain } from "lucide-react";
import { toast } from "sonner";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import {
  useCurateUrl,
  useCommitKnowledge,
} from "@/lib/api/hooks/use-brain-builder";
import { UrlCurateForm } from "@/components/brain-builder/url-curate-form";
import { SkbCandidates } from "@/components/brain-builder/skb-candidates";
import { BrainLibrary } from "@/components/brain-builder/brain-library";
import type {
  BrainCurateResponse,
  BrainCommitItem,
} from "@/lib/api/types";

export default function BrainBuilderPage() {
  const { author } = useAuthor();
  const curateUrl = useCurateUrl();
  const commitKnowledge = useCommitKnowledge();

  const [curateResult, setCurateResult] =
    useState<BrainCurateResponse | null>(null);

  function handleCurate(url: string) {
    if (!author) return;

    curateUrl.mutate(
      { url, author_id: author.id },
      {
        onSuccess: (res) => {
          setCurateResult(res);
          if (res.candidates.length === 0) {
            toast.info(
              "No strategic knowledge blocks found in this URL."
            );
          }
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to curate URL"
          );
        },
      }
    );
  }

  function handleCommit(items: BrainCommitItem[]) {
    if (!author) return;

    commitKnowledge.mutate(
      { author_id: author.id, items },
      {
        onSuccess: (res) => {
          toast.success(
            `Committed ${res.committed_count} items to your Brain`
          );
          setCurateResult(null);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to commit knowledge"
          );
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Brain Builder</h1>
        <AuthorSelector />
      </div>

      <UrlCurateForm
        onCurate={handleCurate}
        isCurating={curateUrl.isPending}
      />

      {curateResult && curateResult.candidates.length > 0 && (
        <>
          <Separator />
          <SkbCandidates
            candidates={curateResult.candidates}
            sourceMetadata={curateResult.source_metadata}
            onCommit={handleCommit}
            isCommitting={commitKnowledge.isPending}
          />
        </>
      )}

      <Separator />

      <BrainLibrary authorId={author?.id} />
    </div>
  );
}
