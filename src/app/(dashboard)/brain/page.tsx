"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";
import { toast } from "sonner";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import {
  useCurateUrl,
  useCommitKnowledge,
} from "@/lib/api/hooks/use-brain-builder";
import { useInbox } from "@/lib/api/hooks/use-inbox";
import { UrlCurateForm } from "@/components/brain-builder/url-curate-form";
import { SkbCandidates } from "@/components/brain-builder/skb-candidates";
import { BrainLibrary } from "@/components/brain-builder/brain-library";
import { InboxReviewSection } from "@/components/brain-builder/inbox-review-section";
import type {
  BrainCurateResponse,
  BrainCommitItem,
} from "@/lib/api/types";

export default function BrainBuilderPage() {
  const { author } = useAuthor();
  const curateUrl = useCurateUrl();
  const commitKnowledge = useCommitKnowledge();
  const { data: inboxData } = useInbox(author?.id);

  const [curateResult, setCurateResult] =
    useState<BrainCurateResponse | null>(null);

  const pendingCount = inboxData?.by_status?.Draft ?? 0;

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

      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="inbox" className="gap-1.5">
            Inbox
            {pendingCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 min-w-4 px-1">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-4 space-y-6">
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
        </TabsContent>

        <TabsContent value="inbox" className="mt-4">
          <InboxReviewSection
            authorId={author?.id}
            userId={author?.user_id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
