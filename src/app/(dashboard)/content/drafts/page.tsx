"use client";

import { useState } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, PenLine } from "lucide-react";
import { toast } from "sonner";
import { useAuthor } from "@/hooks/use-author";
import {
  useContentSessions,
  useArchiveSession,
} from "@/lib/api/hooks/use-content-sessions";
import { DraftCard } from "@/components/drafts/draft-card";
import { OutcomeForm } from "@/components/drafts/outcome-form";
import type { ContentSession } from "@/lib/api/types";

type StatusFilter = "" | "draft" | "completed" | "archived";

export default function DraftsPage() {
  const { author } = useAuthor();
  const [filter, setFilter] = useState<StatusFilter>("");
  const [outcomeSession, setOutcomeSession] =
    useState<ContentSession | null>(null);

  const { data, isLoading } = useContentSessions(
    author?.id,
    filter || undefined
  );
  const archiveSession = useArchiveSession();

  function handleArchive(sessionId: string) {
    archiveSession.mutate(sessionId, {
      onSuccess: () => toast.success("Draft archived"),
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to archive"
        ),
    });
  }

  const sessions = data?.sessions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-6 w-6" />
          <h1 className="text-2xl font-bold">My Drafts</h1>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/content/angles">
            <PenLine className="h-3.5 w-3.5" />
            New Content
          </Link>
        </Button>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as StatusFilter)}
      >
        <TabsList>
          <TabsTrigger value="">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="completed">Published</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {filter
              ? "No content matches this filter."
              : "No drafts yet. Generate content and save it here."}
          </p>
          {!filter && (
            <Button asChild variant="outline" size="sm">
              <Link href="/content/angles">Create your first piece</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <DraftCard
              key={session.id}
              session={session}
              onArchive={handleArchive}
              onAddOutcome={setOutcomeSession}
            />
          ))}
        </div>
      )}

      <OutcomeForm
        session={outcomeSession}
        open={outcomeSession !== null}
        onOpenChange={(open) => {
          if (!open) setOutcomeSession(null);
        }}
      />
    </div>
  );
}
