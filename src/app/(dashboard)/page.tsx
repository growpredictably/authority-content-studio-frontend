"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, Rocket } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CompactScore } from "@/components/command-center/compact-score";
import { DailySyncCards } from "@/components/command-center/daily-sync-cards";
import { SavedItemsDrawer } from "@/components/command-center/saved-items-drawer";
import { SavedForLater } from "@/components/command-center/saved-for-later";
import { PostSyncState } from "@/components/command-center/post-sync-state";
import { MilestoneCelebration } from "@/components/command-center/sync-celebration";
import { useAuthorityScore } from "@/lib/api/hooks/use-command-center";
import type { HabitStats } from "@/lib/api/types";

// ─── Page States ────────────────────────────────────────────────────

type PageState = "sync" | "earned-dashboard";

export default function CommandCenterPage() {
  const { author, isLoading } = useAuthor();
  const [pageState, setPageState] = useState<PageState>("sync");
  const [completedHabitStats, setCompletedHabitStats] = useState<HabitStats | null>(null);
  const [showMilestone, setShowMilestone] = useState(false);
  const scoreBeforeRef = useRef<number | undefined>(undefined);
  const milestoneShownRef = useRef(false);

  // Capture the score before any sync actions for delta calculation
  const { data: scoreData } = useAuthorityScore(author?.id ?? "");
  useEffect(() => {
    if (scoreData && scoreBeforeRef.current === undefined) {
      scoreBeforeRef.current = scoreData.total_score;
    }
  }, [scoreData]);

  // Check for streak milestones on mount
  useEffect(() => {
    if (completedHabitStats && !milestoneShownRef.current) {
      const streak = completedHabitStats.current_streak;
      if ([7, 14, 30, 60, 90].includes(streak)) {
        setShowMilestone(true);
        milestoneShownRef.current = true;
      }
    }
  }, [completedHabitStats]);

  const handleAllComplete = useCallback(
    (habitStats: HabitStats, _scoreBefore: number | undefined) => {
      setCompletedHabitStats(habitStats);
      setPageState("earned-dashboard");
    },
    []
  );

  const handleMilestoneDone = useCallback(() => {
    setShowMilestone(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            Command Center
            <AuthorSelector />
          </h1>
          <p className="text-muted-foreground mt-1">
            {isLoading
              ? "Loading..."
              : author
                ? `Welcome back, ${author.name}`
                : "Welcome to Authority Content Studio"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Compact authority score in header */}
          {author && <CompactScore authorId={author.id} />}
          {author && <SavedItemsDrawer authorId={author.id} />}
        </div>
      </div>

      {/* Main content — progressive disclosure based on state */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : !author ? (
        /* State: New user — no author profile */
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Rocket className="h-10 w-10 mx-auto text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold mb-1">
                Let&apos;s build your authority engine
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Complete your profile to unlock daily syncs, authority scoring,
                and AI-powered content generation.
              </p>
            </div>
            <Button asChild>
              <Link href="/onboarding">Get Started</Link>
            </Button>
          </CardContent>
        </Card>
      ) : pageState === "sync" ? (
        /* State: Sync incomplete — hero card focus */
        <>
          {/* Milestone celebration (fires on page load if streak hit a milestone) */}
          {showMilestone && completedHabitStats && (
            <MilestoneCelebration
              streak={completedHabitStats.current_streak}
              onComplete={handleMilestoneDone}
            />
          )}

          <DailySyncCards
            authorId={author.id}
            onAllComplete={handleAllComplete}
          />

          {/* Saved for later — shows inline when user has bookmarked items */}
          <SavedForLater authorId={author.id} />
        </>
      ) : (
        /* State: Sync complete — earned dashboard as reward */
        <PostSyncState
          authorId={author.id}
          habitStats={completedHabitStats!}
          previousScore={scoreBeforeRef.current}
          currentScore={scoreData?.total_score}
        />
      )}
    </div>
  );
}
