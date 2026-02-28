"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { SyncAction } from "@/lib/api/types";

interface ClarifyActionDrawerProps {
  action: SyncAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  isPending: boolean;
}

export function ClarifyActionDrawer({
  action,
  open,
  onOpenChange,
  onSubmit,
  onSkip,
  isPending,
}: ClarifyActionDrawerProps) {
  const [answer, setAnswer] = useState("");

  const coherenceBefore = action.impact_delta?.before ?? 0;
  const coherenceAfter = action.impact_delta?.after ?? 0;
  const lift = coherenceAfter - coherenceBefore;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
              <Lightbulb className="h-3 w-3 mr-1" />
              Strengthen
            </Badge>
            {action.gap_type && (
              <Badge variant="outline" className="text-xs">
                {action.gap_type}
              </Badge>
            )}
          </div>
          <SheetTitle className="text-left">{action.headline}</SheetTitle>
          <SheetDescription className="text-left">
            {action.description}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Prompt */}
          <div>
            <h4 className="text-sm font-medium mb-2">What we need from you</h4>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm">{action.prompt}</p>
            </div>
          </div>

          {/* Impact visualization */}
          {action.impact_delta && (
            <div>
              <h4 className="text-sm font-medium mb-2">Projected Impact</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Current coherence</span>
                    <span className="tabular-nums">{(coherenceBefore * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={coherenceBefore * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">After this action</span>
                    <span className="tabular-nums font-medium text-green-600 dark:text-green-400">
                      {(coherenceAfter * 100).toFixed(0)}% (+{(lift * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={coherenceAfter * 100} className="h-2" />
                </div>
              </div>
            </div>
          )}

          {/* Context */}
          {(action.theme || action.rationale) && (
            <div>
              <h4 className="text-sm font-medium mb-2">Context</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                {action.theme && (
                  <p>
                    <span className="font-medium text-foreground">Theme:</span>{" "}
                    {action.theme}
                  </p>
                )}
                {action.rationale && <p>{action.rationale}</p>}
              </div>
            </div>
          )}

          {action.effort_minutes && (
            <p className="text-xs text-muted-foreground">
              Estimated time: ~{action.effort_minutes} min
            </p>
          )}

          <Separator />

          {/* Input area */}
          <div className="space-y-3">
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Share your thoughts, experience, or perspective..."
              rows={5}
              className="resize-none"
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onSubmit(answer)}
                disabled={isPending || !answer.trim()}
                className="flex-1"
              >
                Submit Answer
              </Button>
              <Button variant="ghost" onClick={onSkip} disabled={isPending}>
                Skip
              </Button>
            </div>

            {/* Voice Builder link */}
            {action.prompt && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs"
                asChild
              >
                <Link
                  href={`/voice?${new URLSearchParams({
                    prompt: action.prompt,
                    ...(action.theme
                      ? {
                          initialContent: `Theme: ${action.theme}${action.gap_type ? ` | Gap: ${action.gap_type}` : ""}${action.headline ? `\n\n${action.headline}` : ""}`,
                        }
                      : {}),
                  }).toString()}`}
                >
                  <ExternalLink className="h-3 w-3" />
                  Or open in Voice Builder for richer input
                </Link>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
