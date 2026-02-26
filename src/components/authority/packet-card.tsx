"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoherenceGauge } from "./coherence-gauge";
import { ElementBadges } from "./element-badges";
import { ReadinessBadge } from "./readiness-badge";
import { Loader2, RotateCcw } from "lucide-react";
import type { PacketResponse } from "@/lib/api/types";

interface PacketCardProps {
  packet: PacketResponse;
  onRebuild: (id: string) => void;
  onClick: (packet: PacketResponse) => void;
  isRebuilding: boolean;
}

export function PacketCard({
  packet,
  onRebuild,
  onClick,
  isRebuilding,
}: PacketCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm"
      onClick={() => onClick(packet)}
    >
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold leading-snug line-clamp-2">
            {packet.theme}
          </h4>
          <ReadinessBadge stage={packet.readiness_stage} />
        </div>

        <div className="flex justify-center">
          <CoherenceGauge score={packet.coherence_score} size={72} />
        </div>

        <ElementBadges elements={packet.elements} />

        {packet.missing_elements.length > 0 && (
          <p className="text-[10px] text-muted-foreground">
            Missing: {packet.missing_elements.join(", ")}
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          disabled={isRebuilding}
          onClick={(e) => {
            e.stopPropagation();
            onRebuild(packet.id);
          }}
        >
          {isRebuilding ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RotateCcw className="h-3 w-3" />
          )}
          {isRebuilding ? "Rebuilding..." : "Rebuild"}
        </Button>
      </CardContent>
    </Card>
  );
}
