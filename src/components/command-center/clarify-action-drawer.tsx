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
import {
  Lightbulb,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SyncAction } from "@/lib/api/types";

interface ClarifyActionDrawerProps {
  action: SyncAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  isPending: boolean;
}

/** Generate guiding questions based on the action's gap type and theme. */
function getGuidingQuestions(action: SyncAction): string[] {
  const theme = action.theme;
  const gapType = action.gap_type ?? "";

  const questions: string[] = [];

  // Gap-type specific questions
  if (gapType.includes("story") || gapType.includes("anchor")) {
    questions.push(
      "What specific moment or experience shaped this belief for you?",
      "What did you see, feel, or learn that made this real — not just theoretical?"
    );
  } else if (gapType.includes("belief") || gapType.includes("perspective")) {
    questions.push(
      "Why do you hold this belief? What evidence have you seen?",
      "How would you explain this to someone who disagrees?"
    );
  } else if (gapType.includes("framework") || gapType.includes("method")) {
    questions.push(
      "What steps or principles make this approach work?",
      "What mistake do people commonly make that this framework prevents?"
    );
  }

  // Theme-aware question
  if (theme) {
    questions.push(
      `How does this connect to your bigger vision around "${theme}"?`
    );
  }

  // Fallback questions if none matched
  if (questions.length === 0) {
    questions.push(
      "What personal experience or example best illustrates your point?",
      "What would someone need to understand to truly get this?",
      "What makes your perspective on this different from the mainstream?"
    );
  }

  return questions.slice(0, 3);
}

/** Starter phrases the user can click to pre-fill the textarea. */
const starterPhrases = [
  "In my experience...",
  "I learned this when...",
  "The key insight is...",
  "What most people miss is...",
];

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
  const guidingQuestions = getGuidingQuestions(action);

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

          {/* Guiding questions */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
              Think about...
            </h4>
            <ul className="space-y-1.5">
              {guidingQuestions.map((q, i) => (
                <li
                  key={i}
                  className="text-xs text-muted-foreground pl-3 border-l-2 border-amber-200 dark:border-amber-800"
                >
                  {q}
                </li>
              ))}
            </ul>
          </div>

          {/* What makes a great answer */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              What makes a great answer
            </h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-start gap-1.5">
                <span className="text-green-600 mt-0.5">-</span>
                <span>
                  <span className="font-medium text-foreground">Be specific</span> — a real example beats a general statement
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-green-600 mt-0.5">-</span>
                <span>
                  <span className="font-medium text-foreground">Share your experience</span> — what you saw, did, or learned firsthand
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-green-600 mt-0.5">-</span>
                <span>
                  <span className="font-medium text-foreground">Connect the dots</span> — tie it back to what you believe and why
                </span>
              </li>
            </ul>
          </div>

          {/* Impact visualization */}
          {action.impact_delta && (
            <div>
              <h4 className="text-sm font-medium mb-2">Projected Impact</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Current authority strength</span>
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

          {/* Starter phrases */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Start with...
            </p>
            <div className="flex flex-wrap gap-1.5">
              {starterPhrases.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => {
                    if (!answer.trim()) {
                      setAnswer(phrase + " ");
                    } else {
                      setAnswer((prev) => prev + " " + phrase + " ");
                    }
                  }}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    "text-muted-foreground hover:text-foreground hover:border-foreground/30",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  )}
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>

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
