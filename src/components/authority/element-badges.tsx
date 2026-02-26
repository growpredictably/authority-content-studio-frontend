"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PacketResponse } from "@/lib/api/types";

interface ElementBadgesProps {
  elements: PacketResponse["elements"];
}

const elementLabels = [
  { key: "anchor_story" as const, label: "Story" },
  { key: "supporting_belief" as const, label: "Belief" },
  { key: "framework" as const, label: "Framework" },
  { key: "perspective" as const, label: "Perspective" },
];

export function ElementBadges({ elements }: ElementBadgesProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {elementLabels.map(({ key, label }) => {
        const exists = !!elements[key];
        return (
          <Badge
            key={key}
            variant={exists ? "secondary" : "outline"}
            className={cn(
              "text-[10px] px-1.5 py-0",
              !exists && "text-muted-foreground/50 border-dashed"
            )}
          >
            {label}
          </Badge>
        );
      })}
    </div>
  );
}
