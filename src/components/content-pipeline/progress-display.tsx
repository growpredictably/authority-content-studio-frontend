"use client";

import { useProcessingStatus } from "@/lib/api/hooks/use-content-pipeline";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ProgressDisplayProps {
  trackingId: string | null;
  label?: string;
}

export function ProgressDisplay({ trackingId, label }: ProgressDisplayProps) {
  const status = useProcessingStatus(trackingId);

  if (!trackingId) return null;

  const percent = status?.progress_percent ?? 0;
  const phase = status?.current_phase ?? "Initializing";
  const message = status?.phase_message ?? "Starting...";

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium">
            {label ?? "Processing"}
          </span>
        </div>

        <Progress value={percent} className="h-2" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{phase}</span>
          <span>{percent}%</span>
        </div>

        {message && (
          <p className="text-xs text-muted-foreground">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
