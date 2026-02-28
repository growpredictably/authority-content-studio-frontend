"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GapActionCard } from "./gap-action-card";
import { useMarkGapComplete } from "@/lib/api/hooks/use-authority";
import { toast } from "sonner";
import type { PacketGap, GapAnalysisResponse } from "@/lib/api/types";

interface PrioritizedActionsTabsProps {
  groupedGaps: GapAnalysisResponse["grouped_gaps"];
  authorId: string;
  onRemediate: (gap: PacketGap) => void;
}

export function PrioritizedActionsTabs({
  groupedGaps,
  authorId,
  onRemediate,
}: PrioritizedActionsTabsProps) {
  const markComplete = useMarkGapComplete();
  const [completingId, setCompletingId] = useState<string | null>(null);

  function handleMarkComplete(gap: PacketGap) {
    setCompletingId(gap.packet_id);
    markComplete.mutate(
      { author_id: authorId, gap_action_id: gap.gap_action_id ?? gap.packet_id },
      {
        onSuccess: () => {
          toast.success("Action marked complete");
          setCompletingId(null);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to mark complete"
          );
          setCompletingId(null);
        },
      }
    );
  }

  const tabs = [
    {
      key: "quick_wins",
      label: "Quick Wins",
      gaps: groupedGaps.quick_wins ?? [],
    },
    {
      key: "strategic",
      label: "Strategic",
      gaps: groupedGaps.strategic ?? [],
    },
    { key: "polish", label: "Polish", gaps: groupedGaps.polish ?? [] },
  ];

  return (
    <Tabs defaultValue="quick_wins">
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key} className="gap-1.5">
            {tab.label}
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4"
            >
              {tab.gaps.length}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.key} value={tab.key} className="mt-4">
          {tab.gaps.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No {tab.label.toLowerCase()} actions at this time.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tab.gaps.map((gap, idx) => (
                <GapActionCard
                  key={gap.packet_id + idx}
                  gap={gap}
                  onMarkComplete={handleMarkComplete}
                  onRemediate={onRemediate}
                  isCompleting={completingId === gap.packet_id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
