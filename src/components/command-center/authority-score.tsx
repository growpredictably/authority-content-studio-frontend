"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthorityScore } from "@/lib/api/hooks/use-command-center";

const bandColors: Record<string, { stroke: string; text: string; bg: string }> = {
  red: {
    stroke: "stroke-red-500",
    text: "text-red-500",
    bg: "bg-red-500",
  },
  orange: {
    stroke: "stroke-orange-500",
    text: "text-orange-500",
    bg: "bg-orange-500",
  },
  yellow: {
    stroke: "stroke-yellow-500",
    text: "text-yellow-500",
    bg: "bg-yellow-500",
  },
  green: {
    stroke: "stroke-green-500",
    text: "text-green-500",
    bg: "bg-green-500",
  },
};

function ScoreGauge({
  score,
  band,
}: {
  score: number;
  band: string;
}) {
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const colors = bandColors[band] ?? bandColors.red;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        {/* Score ring */}
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
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn("text-4xl font-bold tabular-nums", colors.text)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

interface AuthorityScoreProps {
  authorId: string;
}

export function AuthorityScore({ authorId }: AuthorityScoreProps) {
  const { data, isLoading, error } = useAuthorityScore(authorId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Authority Readiness Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <Skeleton className="h-40 w-40 rounded-full" />
            <div className="flex-1 space-y-4 w-full">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Authority Readiness Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load authority score. Try refreshing.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4" />
          Authority Readiness Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <ScoreGauge score={data.total_score} band={data.score_band} />

          <div className="flex-1 space-y-3 w-full">
            {data.breakdown.map((item) => {
              const pct =
                item.max_score > 0
                  ? (item.score / item.max_score) * 100
                  : 0;

              return (
                <Tooltip key={item.category}>
                  <TooltipTrigger asChild>
                    <div className="space-y-1 cursor-default">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {item.category}
                        </span>
                        <span className="tabular-nums font-medium">
                          {item.score.toFixed(1)} / {item.max_score}
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.raw_value}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    {item.improvement_tip}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
