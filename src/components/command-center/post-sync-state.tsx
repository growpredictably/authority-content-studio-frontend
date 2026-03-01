"use client";

import { motion } from "framer-motion";
import { Check, Flame } from "lucide-react";
import { AuthorityScore } from "./authority-score";
import { QuickStats } from "./quick-stats";
import { AssetLeverageCard } from "./asset-leverage-card";
import { ContextualNextSteps } from "./contextual-next-steps";
import type { HabitStats } from "@/lib/api/types";

interface PostSyncStateProps {
  authorId: string;
  habitStats: HabitStats;
  previousScore?: number;
  currentScore?: number;
}

export function PostSyncState({
  authorId,
  habitStats,
  previousScore,
  currentScore,
}: PostSyncStateProps) {
  const scoreDelta =
    previousScore !== undefined && currentScore !== undefined
      ? currentScore - previousScore
      : undefined;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Completion banner */}
      <div className="flex items-center justify-between rounded-lg border bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/40">
            <Check className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold">All synced for today!</p>
            <p className="text-xs text-muted-foreground">
              Come back tomorrow to keep building.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-orange-500">
            <Flame className="h-5 w-5" />
            <span className="text-lg font-bold tabular-nums">
              {habitStats.current_streak}
            </span>
            <span className="text-xs">day streak</span>
          </div>
          {scoreDelta !== undefined && scoreDelta > 0 && (
            <motion.span
              className="text-sm font-medium text-green-600"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Score +{scoreDelta.toFixed(1)}
            </motion.span>
          )}
        </div>
      </div>

      {/* Earned dashboard — the reward */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Your Authority Dashboard
        </h3>
        <AuthorityScore authorId={authorId} />
      </div>

      <QuickStats authorId={authorId} />

      <AssetLeverageCard authorId={authorId} />

      {/* Contextual next steps */}
      <ContextualNextSteps authorId={authorId} />
    </motion.div>
  );
}
