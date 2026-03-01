"use client";

import { Flame, Award } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { HabitStats } from "@/lib/api/types";

// Milestone-based visual evolution
function getFlameStyle(streak: number, status: string) {
  if (status === "broken" || status === "none") {
    return { color: "text-muted-foreground", animate: false, badge: null };
  }
  if (status === "at_risk") {
    return { color: "text-orange-500", animate: true, badge: null };
  }
  // Active — evolve by streak length
  if (streak >= 30) return { color: "text-amber-400", animate: true, badge: "gold" as const };
  if (streak >= 14) return { color: "text-amber-400", animate: true, badge: "silver" as const };
  if (streak >= 7) return { color: "text-yellow-500", animate: true, badge: null };
  if (streak >= 1) return { color: "text-orange-500", animate: true, badge: null };
  return { color: "text-muted-foreground", animate: false, badge: null };
}

function getTooltipContent(stats: HabitStats): string {
  if (stats.streak_status === "at_risk" && stats.hours_until_streak_break) {
    return `${stats.hours_until_streak_break}h until streak breaks! Complete your sync now.`;
  }
  if (stats.streak_status === "broken" || stats.current_streak === 0) {
    if (stats.longest_streak > 0) {
      return `Previous best: ${stats.longest_streak} days. Let's beat it.`;
    }
    return "Complete a Daily Sync to start your streak";
  }
  return `${stats.current_streak} day streak · Best: ${stats.longest_streak} days`;
}

function getStreakLabel(stats: HabitStats): string {
  if (stats.streak_status === "broken" && stats.longest_streak > 0) {
    return `Best: ${stats.longest_streak}d`;
  }
  return `${stats.current_streak} day streak`;
}

const badgeColors = {
  gold: "text-amber-400",
  silver: "text-slate-400",
};

interface StreakDisplayProps {
  stats: HabitStats;
  showCountdown?: boolean;
}

export function StreakDisplay({ stats, showCountdown }: StreakDisplayProps) {
  const flame = getFlameStyle(stats.current_streak, stats.streak_status);

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1.5", flame.color)}>
            <div className="relative">
              <Flame
                className={cn(
                  "h-5 w-5",
                  flame.animate && "animate-pulse"
                )}
              />
              {flame.badge && (
                <Award
                  className={cn(
                    "h-3 w-3 absolute -top-1 -right-1.5",
                    badgeColors[flame.badge]
                  )}
                />
              )}
            </div>
            <span className="text-lg font-bold tabular-nums">
              {stats.current_streak}
            </span>
            <span className="text-xs">
              {stats.streak_status === "broken" && stats.longest_streak > 0
                ? `(best: ${stats.longest_streak})`
                : "day streak"}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>{getTooltipContent(stats)}</TooltipContent>
      </Tooltip>

      {/* At-risk countdown */}
      {showCountdown &&
        stats.streak_status === "at_risk" &&
        stats.hours_until_streak_break && (
          <span className="text-xs font-medium text-orange-600 animate-pulse">
            {stats.hours_until_streak_break}h left
          </span>
        )}
    </div>
  );
}
