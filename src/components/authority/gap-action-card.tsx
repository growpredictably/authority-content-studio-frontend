"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Wrench,
} from "lucide-react";
import type { PacketGap } from "@/lib/api/types";
import { BrainCandidatesSection } from "./brain-candidates-section";

interface GapActionCardProps {
  gap: PacketGap;
  onMarkComplete: (gap: PacketGap) => void;
  onRemediate: (gap: PacketGap) => void;
  isCompleting: boolean;
}

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  medium:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function GapActionCard({
  gap,
  onMarkComplete,
  onRemediate,
  isCompleting,
}: GapActionCardProps) {
  const [promptOpen, setPromptOpen] = useState(false);

  return (
    <Card>
      <CardContent className="pt-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[10px]">
              {gap.gap_type.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {gap.blocking_element}
            </Badge>
            <Badge
              variant="secondary"
              className={cn("text-[10px]", priorityColors[gap.priority])}
            >
              {gap.priority}
            </Badge>
          </div>
          {gap.has_unlinked_knowledge && (
            <Brain className="h-3.5 w-3.5 text-primary shrink-0" />
          )}
        </div>

        <div>
          <p className="text-sm font-medium">{gap.theme}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {Math.round(gap.coherence_score * 100)}% →{" "}
            {Math.round(gap.expected_coherence * 100)}%
          </p>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">
          {gap.diagnosis}
        </p>

        {gap.has_unlinked_knowledge && gap.brain_candidates.length > 0 && (
          <BrainCandidatesSection candidates={gap.brain_candidates} />
        )}

        <Collapsible open={promptOpen} onOpenChange={setPromptOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs w-full h-7"
            >
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  promptOpen && "rotate-180"
                )}
              />
              Voice Builder Prompt
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2 mt-1">
              {gap.voice_builder_prompt}
            </p>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1 text-xs"
            disabled={isCompleting}
            onClick={() => onMarkComplete(gap)}
          >
            {isCompleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            Complete
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1 gap-1 text-xs"
            onClick={() => onRemediate(gap)}
          >
            <Wrench className="h-3 w-3" />
            Fix Inline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
