"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  X,
  Pencil,
  ChevronDown,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { OptimizationSuggestion, PositioningGap } from "@/lib/api/types";
import {
  useApproveSuggestion,
  useDismissSuggestion,
} from "@/lib/api/hooks/use-optimizer";

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "bg-green-500/10 text-green-700 dark:text-green-400";
  if (confidence >= 0.6) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
  return "bg-red-500/10 text-red-700 dark:text-red-400";
}

function priorityColor(priority: string): string {
  if (priority === "high") return "bg-red-500/10 text-red-700 dark:text-red-400";
  if (priority === "medium") return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
  return "bg-green-500/10 text-green-700 dark:text-green-400";
}

function SuggestionCard({
  suggestion,
  authorId,
  onResolved,
}: {
  suggestion: OptimizationSuggestion;
  authorId: string;
  onResolved: (id: string) => void;
}) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(suggestion.proposed_text);

  const approve = useApproveSuggestion();
  const dismiss = useDismissSuggestion();

  function handleApprove() {
    const textToCopy = isEditing ? editedText : suggestion.proposed_text;

    // Copy proposed text to clipboard
    navigator.clipboard.writeText(textToCopy).catch(() => {});

    if (suggestion.id) {
      const edited = isEditing ? editedText : undefined;
      approve.mutate(
        { suggestionId: suggestion.id, authorId, editedText: edited },
        {
          onSuccess: () => {
            toast.success("Approved — text copied to clipboard");
            onResolved(suggestion.id!);
          },
          onError: (err) =>
            toast.error(
              err instanceof Error ? err.message : "Failed to approve"
            ),
        }
      );
    } else {
      toast.success("Approved — text copied to clipboard");
      onResolved(`local-${Date.now()}`);
    }
  }

  function handleDismiss() {
    if (suggestion.id) {
      dismiss.mutate(
        { suggestionId: suggestion.id, authorId },
        {
          onSuccess: () => {
            toast.success("Suggestion dismissed");
            onResolved(suggestion.id!);
          },
          onError: (err) =>
            toast.error(
              err instanceof Error ? err.message : "Failed to dismiss"
            ),
        }
      );
    } else {
      toast.success("Suggestion dismissed");
      onResolved(`local-${Date.now()}`);
    }
  }

  const isActioning = approve.isPending || dismiss.isPending;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Current text (collapsed) */}
        {suggestion.current_text && (
          <Collapsible open={showCurrent} onOpenChange={setShowCurrent}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    !showCurrent && "-rotate-90"
                  )}
                />
                Current text
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="mt-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                {suggestion.current_text}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Proposed text */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Proposed
          </p>
          {isEditing ? (
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={4}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">
              {suggestion.proposed_text}
            </p>
          )}
        </div>

        {/* Reasoning */}
        <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>

        {/* Rationale summary (enriched scans) */}
        {suggestion.rationale_summary && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">
            {suggestion.rationale_summary}
          </p>
        )}

        {/* Metrics row */}
        <div className="flex items-center gap-3">
          <Badge className={cn("text-xs", confidenceColor(suggestion.confidence))}>
            {Math.round(suggestion.confidence * 100)}% confidence
          </Badge>
          <div className="flex items-center gap-2 flex-1 max-w-48">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Drift
            </span>
            <Progress
              value={suggestion.drift_score * 100}
              className="h-1.5"
            />
            <span className="text-xs text-muted-foreground">
              {(suggestion.drift_score * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Research sources */}
        {suggestion.research_sources && suggestion.research_sources.length > 0 && (
          <Collapsible open={showSources} onOpenChange={setShowSources}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    !showSources && "-rotate-90"
                  )}
                />
                {suggestion.research_sources.length} research source
                {suggestion.research_sources.length !== 1 && "s"}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="mt-2 space-y-1">
                {suggestion.research_sources.map((source, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {source}
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Actions */}
        <Separator />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={isActioning}
            className="gap-1"
          >
            <Check className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDismiss}
            disabled={isActioning}
            className="gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Dismiss
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsEditing(!isEditing);
              if (isEditing) setEditedText(suggestion.proposed_text);
            }}
            className="gap-1"
          >
            <Pencil className="h-3.5 w-3.5" />
            {isEditing ? "Cancel Edit" : "Edit"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GapCard({ gap }: { gap: PositioningGap }) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <p className="text-sm font-medium">{gap.gap}</p>
          <Badge className={cn("text-xs ml-auto", priorityColor(gap.priority))}>
            {gap.priority}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{gap.recommendation}</p>
        <Badge variant="outline" className="text-xs">
          {gap.authority_signal}
        </Badge>
      </CardContent>
    </Card>
  );
}

interface DriftScanResultsProps {
  suggestions: OptimizationSuggestion[];
  positioningGaps?: PositioningGap[];
  authorId: string;
}

export function DriftScanResults({
  suggestions,
  positioningGaps,
  authorId,
}: DriftScanResultsProps) {
  const [resolvedKeys, setResolvedKeys] = useState<Set<string>>(new Set());

  // Give each suggestion a stable key for tracking
  const keyed = suggestions.map((s, i) => ({
    ...s,
    _key: s.id || `idx-${i}`,
  }));

  const activeSuggestions = keyed.filter((s) => !resolvedKeys.has(s._key));

  function handleResolved(key: string) {
    setResolvedKeys((prev) => new Set(prev).add(key));
  }

  return (
    <div className="space-y-6">
      {activeSuggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">
            Suggestions ({activeSuggestions.length})
          </h3>
          {activeSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion._key}
              suggestion={suggestion}
              authorId={authorId}
              onResolved={() => handleResolved(suggestion._key)}
            />
          ))}
        </div>
      )}

      {resolvedKeys.size > 0 && (
        <p className="text-xs text-muted-foreground">
          {resolvedKeys.size} suggestion{resolvedKeys.size !== 1 && "s"} resolved
        </p>
      )}

      {positioningGaps && positioningGaps.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">
            Positioning Gaps ({positioningGaps.length})
          </h3>
          {positioningGaps.map((gap, i) => (
            <GapCard key={i} gap={gap} />
          ))}
        </div>
      )}
    </div>
  );
}
