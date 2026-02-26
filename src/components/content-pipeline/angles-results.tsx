"use client";

import { usePipeline } from "@/lib/content-pipeline/pipeline-context";
import { AngleCard } from "./angle-card";
import type { ContentAngle } from "@/lib/api/types";

interface AnglesResultsProps {
  onAngleSelected: (angle: ContentAngle) => void;
}

export function AnglesResults({ onAngleSelected }: AnglesResultsProps) {
  const { state, selectAngle } = usePipeline();

  if (state.angles.length === 0) return null;

  function handleSelect(angle: ContentAngle) {
    selectAngle(angle);
    onAngleSelected(angle);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {state.angles.length} Angles Generated
        </h3>
        <p className="text-xs text-muted-foreground">
          Select an angle to continue
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {state.angles.map((angle, idx) => (
          <AngleCard
            key={angle.angle_id || idx}
            angle={angle}
            isSelected={
              state.selectedAngle?.angle_id === angle.angle_id &&
              state.selectedAngle?.title === angle.title
            }
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
