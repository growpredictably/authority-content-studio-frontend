"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2, ExternalLink } from "lucide-react";
import type { BrainCandidate, BrainCommitItem } from "@/lib/api/types";

interface SkbCandidatesProps {
  candidates: BrainCandidate[];
  sourceMetadata: {
    url: string;
    title?: string;
    author?: string;
  };
  onCommit: (items: BrainCommitItem[]) => void;
  isCommitting: boolean;
}

type EndorsementLevel = "full" | "partial" | "anti_model" | "reference";

interface CandidateState {
  accepted: boolean;
  endorsement: EndorsementLevel;
  notes: string;
}

const endorsementLabels: Record<EndorsementLevel, { label: string; description: string }> = {
  full: { label: "Full", description: "I stand behind this completely" },
  partial: { label: "Partial", description: "Useful data, but I don't fully agree" },
  anti_model: { label: "Anti-Model", description: "I disagree — this is what I argue against" },
  reference: { label: "Reference", description: "Good to know, but not my stance" },
};

const typeColors: Record<string, string> = {
  framework: "bg-green-100 text-green-700",
  myth: "bg-red-100 text-red-700",
  truth: "bg-blue-100 text-blue-700",
  statistic: "bg-purple-100 text-purple-700",
};

export function SkbCandidates({
  candidates,
  sourceMetadata,
  onCommit,
  isCommitting,
}: SkbCandidatesProps) {
  const [states, setStates] = useState<Record<string, CandidateState>>(() => {
    const init: Record<string, CandidateState> = {};
    candidates.forEach((c) => {
      init[c.temp_id] = { accepted: true, endorsement: "full", notes: "" };
    });
    return init;
  });

  function toggleAccept(tempId: string) {
    setStates((prev) => ({
      ...prev,
      [tempId]: { ...prev[tempId], accepted: !prev[tempId].accepted },
    }));
  }

  function setEndorsement(tempId: string, level: EndorsementLevel) {
    setStates((prev) => ({
      ...prev,
      [tempId]: { ...prev[tempId], endorsement: level },
    }));
  }

  function setNotes(tempId: string, notes: string) {
    setStates((prev) => ({
      ...prev,
      [tempId]: { ...prev[tempId], notes },
    }));
  }

  const acceptedCount = Object.values(states).filter((s) => s.accepted).length;

  function handleCommit() {
    const items: BrainCommitItem[] = candidates
      .filter((c) => states[c.temp_id].accepted)
      .map((c) => ({
        title: c.title,
        summary: c.summary,
        key_quotes: c.key_quotes,
        endorsement_level: states[c.temp_id].endorsement,
        user_notes: states[c.temp_id].notes || undefined,
        strategic_tags: c.suggested_tags,
        source_url: sourceMetadata.url,
        source_title: sourceMetadata.title,
        source_author: sourceMetadata.author,
        source_type: "article" as const,
      }));
    onCommit(items);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">
            Strategic Knowledge Blocks ({candidates.length})
          </h3>
          {sourceMetadata.title && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              From: {sourceMetadata.title}
              <ExternalLink className="h-3 w-3 inline" />
            </p>
          )}
        </div>
        <Badge variant="secondary" className="text-xs">
          {acceptedCount} selected
        </Badge>
      </div>

      {candidates.map((candidate) => {
        const state = states[candidate.temp_id];
        return (
          <Card
            key={candidate.temp_id}
            className={!state.accepted ? "opacity-40 border-dashed" : undefined}
          >
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge className={typeColors[candidate.type] ?? "bg-gray-100 text-gray-700"}>
                      {candidate.type}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{candidate.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {candidate.summary}
                  </p>
                </div>
                <Button
                  variant={state.accepted ? "ghost" : "outline"}
                  size="icon"
                  className="shrink-0 h-7 w-7"
                  onClick={() => toggleAccept(candidate.temp_id)}
                >
                  {state.accepted ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-red-500" />
                  )}
                </Button>
              </div>

              {candidate.key_quotes.length > 0 && (
                <div className="text-[10px] text-muted-foreground border-l-2 border-muted pl-2 space-y-1">
                  {candidate.key_quotes.slice(0, 2).map((q, i) => (
                    <p key={i} className="italic line-clamp-2">
                      &ldquo;{q}&rdquo;
                    </p>
                  ))}
                </div>
              )}

              {state.accepted && (
                <div className="space-y-2 pt-1">
                  <Select
                    value={state.endorsement}
                    onValueChange={(v) =>
                      setEndorsement(
                        candidate.temp_id,
                        v as EndorsementLevel
                      )
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(endorsementLabels).map(
                        ([key, { label, description }]) => (
                          <SelectItem key={key} value={key}>
                            <span className="font-medium">{label}</span>
                            <span className="text-muted-foreground">
                              {" "}
                              — {description}
                            </span>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Your notes (optional)..."
                    value={state.notes}
                    onChange={(e) =>
                      setNotes(candidate.temp_id, e.target.value)
                    }
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>
              )}

              {candidate.suggested_tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {candidate.suggested_tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[10px]"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Button
        onClick={handleCommit}
        disabled={acceptedCount === 0 || isCommitting}
        className="w-full gap-2"
      >
        {isCommitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
        {isCommitting
          ? "Committing to Brain..."
          : `Commit ${acceptedCount} Items to Brain`}
      </Button>
    </div>
  );
}
