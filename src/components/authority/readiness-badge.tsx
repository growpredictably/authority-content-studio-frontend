"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReadinessBadgeProps {
  stage: "draft" | "calibrating" | "ready";
}

const stageConfig = {
  ready: {
    label: "Flagship",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  calibrating: {
    label: "Core",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  draft: {
    label: "Emerging",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

export function ReadinessBadge({ stage }: ReadinessBadgeProps) {
  const config = stageConfig[stage];
  return (
    <Badge variant="secondary" className={cn("text-[10px]", config.className)}>
      {config.label}
    </Badge>
  );
}
