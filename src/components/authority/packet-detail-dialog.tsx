"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Wrench } from "lucide-react";
import { CoherenceGauge } from "./coherence-gauge";
import { ReadinessBadge } from "./readiness-badge";
import { PacketFixDrawer } from "./packet-fix-drawer";
import type { PacketResponse } from "@/lib/api/types";

interface PacketDetailDialogProps {
  packet: PacketResponse | null;
  authorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const elementLabels: {
  key: keyof PacketResponse["elements"];
  label: string;
  icon: string;
}[] = [
  { key: "anchor_story", label: "Anchor Story", icon: "📖" },
  { key: "supporting_belief", label: "Supporting Belief", icon: "💡" },
  { key: "framework", label: "Framework", icon: "🔧" },
  { key: "perspective", label: "Perspective", icon: "🔍" },
];

export function PacketDetailDialog({
  packet,
  authorId,
  open,
  onOpenChange,
}: PacketDetailDialogProps) {
  const [fixDrawerOpen, setFixDrawerOpen] = useState(false);

  if (!packet) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg">{packet.theme}</DialogTitle>
            <ReadinessBadge stage={packet.readiness_stage} />
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <CoherenceGauge score={packet.coherence_score} size={64} />
            <div className="text-sm">
              <p className="font-medium">
                Authority Strength: {Math.round(packet.coherence_score * 100)}%
              </p>
              <p className="text-muted-foreground text-xs">
                {packet.is_complete ? "Complete" : "Incomplete"} packet
              </p>
            </div>
            {!packet.is_complete && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto gap-1.5"
                onClick={() => setFixDrawerOpen(true)}
              >
                <Wrench className="h-3.5 w-3.5" />
                Fix Missing Elements
              </Button>
            )}
          </div>

          {packet.narrative_logic && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-1.5">
                  Narrative Logic
                </h4>
                <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
                  {packet.narrative_logic}
                </p>
              </div>
            </>
          )}

          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Elements</h4>
            {elementLabels.map(({ key, label, icon }) => {
              const element = packet.elements[key];
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{icon}</span>
                    <span className="text-xs font-medium">{label}</span>
                    {!element && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-dashed text-muted-foreground/50"
                      >
                        Missing
                      </Badge>
                    )}
                  </div>
                  {element && (
                    <div className="ml-6 space-y-0.5">
                      {element.title && (
                        <p className="text-xs font-medium">
                          {element.title}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-4">
                        {element.text}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {packet.missing_elements.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-1.5">
                  Missing Elements
                </h4>
                <ul className="space-y-1">
                  {packet.missing_elements.map((el, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground list-disc ml-4"
                    >
                      {el}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {packet.improvement_suggestions && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-1.5">
                  Improvement Suggestions
                </h4>
                <p className="text-xs text-muted-foreground">
                  {packet.improvement_suggestions}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>

      <PacketFixDrawer
        packetId={packet.id}
        packetTheme={packet.theme}
        authorId={authorId}
        open={fixDrawerOpen}
        onOpenChange={setFixDrawerOpen}
      />
    </Dialog>
  );
}
