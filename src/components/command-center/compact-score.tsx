"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuthorityScore } from "@/lib/api/hooks/use-command-center";

const bandColors: Record<string, { stroke: string; text: string }> = {
  red: { stroke: "stroke-red-500", text: "text-red-500" },
  orange: { stroke: "stroke-orange-500", text: "text-orange-500" },
  yellow: { stroke: "stroke-yellow-500", text: "text-yellow-500" },
  green: { stroke: "stroke-green-500", text: "text-green-500" },
};

interface CompactScoreProps {
  authorId: string;
}

export function CompactScore({ authorId }: CompactScoreProps) {
  const { data, isLoading } = useAuthorityScore(authorId);

  if (isLoading) {
    return <Skeleton className="h-10 w-24 rounded-full" />;
  }

  if (!data) return null;

  const size = 36;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (data.total_score / 100) * circumference;
  const colors = bandColors[data.score_band] ?? bandColors.red;

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-muted"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={colors.stroke}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <span className={cn("absolute text-xs font-bold tabular-nums", colors.text)}>
          {data.total_score}
        </span>
      </div>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        Authority Score
      </span>
    </div>
  );
}
