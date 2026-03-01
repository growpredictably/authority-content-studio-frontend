"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDailySync } from "@/lib/api/hooks/use-command-center";
import { StreakDisplay } from "./streak-display";
import { SyncCard } from "./sync-card";
import { MicroCelebration, MacroCelebration } from "./sync-celebration";
import type { SyncAction, HabitStats } from "@/lib/api/types";

type Phase =
  | "action"         // Showing a sync card
  | "micro-celebrate" // Brief interstitial after completing one action
  | "macro-celebrate" // All 3 done — confetti + identity message
  | "complete";       // Post-sync state (parent handles rendering)

interface CompletedActionInfo {
  actionType: SyncAction["action_type"];
  message?: string;
  impactDelta?: { before: number; after: number };
  habitStats?: HabitStats;
}

interface DailySyncCardsProps {
  authorId: string;
  onAllComplete: (habitStats: HabitStats, scoreBefore: number | undefined) => void;
}

export function DailySyncCards({ authorId, onAllComplete }: DailySyncCardsProps) {
  const { data, isLoading, error } = useDailySync(authorId);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("action");
  const [lastCompleted, setLastCompleted] = useState<CompletedActionInfo | null>(null);
  const scoreBeforeRef = useRef<number | undefined>(undefined);

  // Store the initial score for delta calculation
  useEffect(() => {
    if (data && scoreBeforeRef.current === undefined) {
      // Will be populated by parent passing it in, or we just skip the delta
    }
  }, [data]);

  const handleActionCompleted = useCallback(
    (action: SyncAction, message?: string, habitStats?: HabitStats) => {
      setCompletedIds((prev) => new Set(prev).add(action.action_id));
      setLastCompleted({
        actionType: action.action_type,
        message,
        impactDelta: action.impact_delta ?? undefined,
        habitStats,
      });
      setPhase("micro-celebrate");
    },
    []
  );

  const handleMicroCelebrationDone = useCallback(() => {
    if (!data) return;
    const totalActions = data.actions.length;
    const newCompletedCount = completedIds.size; // already incremented

    if (newCompletedCount >= totalActions) {
      // All done — macro celebration
      setPhase("macro-celebrate");
    } else {
      // Move to next card
      setCurrentIndex((prev) => prev + 1);
      setPhase("action");
    }
  }, [data, completedIds.size]);

  const handleMacroCelebrationDone = useCallback(() => {
    setPhase("complete");
    if (lastCompleted?.habitStats) {
      onAllComplete(lastCompleted.habitStats, scoreBeforeRef.current);
    }
  }, [lastCompleted, onAllComplete]);

  const handleActionSkipped = useCallback(
    (action: SyncAction) => {
      // Skips don't get celebrated, just move forward
      setCompletedIds((prev) => new Set(prev).add(action.action_id));
      if (!data) return;
      if (completedIds.size + 1 >= data.actions.length) {
        // If last action was skipped, still show macro
        setPhase("macro-celebrate");
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [data, completedIds.size]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
        <div className="flex justify-center gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-2.5 w-2.5 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Unable to load daily sync actions. Try refreshing.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeActions = data.actions.filter(
    (a) => !completedIds.has(a.action_id)
  );

  // If no actions available at all (no DNA yet)
  if (data.actions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CalendarCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No sync actions available. Build more DNA to unlock daily actions.
          </p>
        </CardContent>
      </Card>
    );
  }

  // If all already completed (e.g., returning to page)
  if (activeActions.length === 0 && phase === "action") {
    // Trigger parent to show earned dashboard
    if (data.habit_stats) {
      onAllComplete(data.habit_stats, undefined);
    }
    return null;
  }

  const currentAction = activeActions[0];
  const totalCount = data.actions.length;
  const completedCount = completedIds.size;
  const isAtRisk = data.habit_stats.streak_status === "at_risk";

  return (
    <div className="space-y-4">
      {/* Header row: greeting + streak */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Daily Sync
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data.greeting}
          </p>
        </div>
        <StreakDisplay stats={data.habit_stats} showCountdown={isAtRisk} />
      </div>

      {/* At-risk urgency banner */}
      {isAtRisk && data.habit_stats.hours_until_streak_break && (
        <motion.div
          className="rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20 px-4 py-2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
            ⚡ {data.habit_stats.hours_until_streak_break} hours until your streak breaks
          </p>
        </motion.div>
      )}

      {/* The main content area — single card or celebration */}
      <div className={cn(
        "min-h-[280px] flex items-start justify-center",
        isAtRisk && "ring-2 ring-orange-200 dark:ring-orange-900 rounded-lg"
      )}>
        <AnimatePresence mode="wait">
          {phase === "action" && currentAction && (
            <motion.div
              key={currentAction.action_id}
              className="w-full"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <SyncCard
                action={currentAction}
                authorId={authorId}
                sessionId={data.session_id}
                heroMode
                onCompleted={(message, habitStats) =>
                  handleActionCompleted(currentAction, message, habitStats)
                }
                onSkipped={() => handleActionSkipped(currentAction)}
              />
            </motion.div>
          )}

          {phase === "micro-celebrate" && lastCompleted && (
            <MicroCelebration
              key="micro"
              visible
              actionType={lastCompleted.actionType}
              message={lastCompleted.message}
              impactDelta={lastCompleted.impactDelta}
              onComplete={handleMicroCelebrationDone}
            />
          )}

          {phase === "macro-celebrate" && (
            <MacroCelebration
              key="macro"
              visible
              habitStats={lastCompleted?.habitStats ?? data.habit_stats}
              onComplete={handleMacroCelebrationDone}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      {phase !== "complete" && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalCount }).map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-colors duration-300",
                i < completedCount
                  ? "bg-green-500"
                  : i === completedCount && phase === "action"
                    ? "bg-primary"
                    : "bg-muted"
              )}
              animate={
                i === completedCount - 1 && phase === "micro-celebrate"
                  ? { scale: [1, 1.4, 1] }
                  : {}
              }
              transition={{ duration: 0.3 }}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            {completedCount} of {totalCount}
          </span>
        </div>
      )}
    </div>
  );
}
