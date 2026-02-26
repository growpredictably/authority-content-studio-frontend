"use client";

import { Flame } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { HabitStats } from "@/lib/api/types";

const statusStyles: Record<string, string> = {
  active: "text-green-500",
  at_risk: "text-orange-500",
  broken: "text-red-400",
  none: "text-muted-foreground",
};

interface StreakDisplayProps {
  stats: HabitStats;
}

export function StreakDisplay({ stats }: StreakDisplayProps) {
  const colorClass = statusStyles[stats.streak_status] ?? statusStyles.none;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("flex items-center gap-1.5", colorClass)}>
          <Flame
            className={cn(
              "h-5 w-5",
              stats.streak_status === "active" && "animate-pulse"
            )}
          />
          <span className="text-lg font-bold tabular-nums">
            {stats.current_streak}
          </span>
          <span className="text-xs">day streak</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {stats.streak_status === "at_risk" && stats.hours_until_streak_break
          ? `${stats.hours_until_streak_break}h until streak breaks`
          : stats.streak_status === "active"
            ? `Longest: ${stats.longest_streak} days`
            : stats.current_streak === 0
              ? "Complete a Daily Sync to start your streak"
              : `Longest: ${stats.longest_streak} days`}
      </TooltipContent>
    </Tooltip>
  );
}
