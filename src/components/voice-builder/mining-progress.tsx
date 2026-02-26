"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { MiningJobStatus } from "@/lib/api/types";

interface MiningProgressProps {
  job: MiningJobStatus;
}

const phaseLabels: Record<string, string> = {
  normalizing_content: "Normalizing content...",
  extracting_elements: "Extracting stories, beliefs & patterns...",
  merging_data: "Merging with existing DNA...",
  done: "Mining complete!",
};

export function MiningProgress({ job }: MiningProgressProps) {
  const isComplete = job.status === "completed";
  const isFailed = job.status === "failed";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : isFailed ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {isComplete
            ? "Mining Complete"
            : isFailed
              ? "Mining Failed"
              : "Mining Your Voice DNA"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={job.progress_percent} className="h-2" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {job.current_phase
              ? phaseLabels[job.current_phase] ?? job.current_phase
              : "Initializing..."}
          </span>
          <span className="tabular-nums">{job.progress_percent}%</span>
        </div>

        {isFailed && job.error && (
          <p className="text-xs text-red-500 mt-2">{job.error}</p>
        )}
      </CardContent>
    </Card>
  );
}
