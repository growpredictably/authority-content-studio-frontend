"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Brain, ChevronDown } from "lucide-react";
import type { GapBrainCandidate } from "@/lib/api/types";

interface BrainCandidatesSectionProps {
  candidates: GapBrainCandidate[];
}

const endorsementColors: Record<string, string> = {
  full: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  partial:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  anti_model:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  reference:
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function BrainCandidatesSection({
  candidates,
}: BrainCandidatesSectionProps) {
  const [open, setOpen] = useState(false);

  if (!candidates || candidates.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs w-full h-7"
        >
          <Brain className="h-3 w-3 text-primary" />
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              open && "rotate-180"
            )}
          />
          {candidates.length} Brain Candidate
          {candidates.length > 1 ? "s" : ""}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 mt-1">
          {candidates.map((candidate) => (
            <div
              key={candidate.knowledge_id}
              className="rounded-md border p-2 space-y-1"
            >
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-medium truncate">
                  {candidate.title}
                </p>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] shrink-0",
                    endorsementColors[candidate.endorsement_level]
                  )}
                >
                  {candidate.endorsement_level.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {candidate.summary}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>Match: {Math.round(candidate.similarity * 100)}%</span>
                {candidate.source_title && (
                  <span className="truncate">
                    From: {candidate.source_title}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
