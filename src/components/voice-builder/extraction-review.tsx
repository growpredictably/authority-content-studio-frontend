"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Lightbulb,
  Wrench,
  Eye,
  Music,
  Check,
  X,
  Loader2,
} from "lucide-react";
import type { VoiceIngestData } from "@/lib/api/types";

interface ExtractionReviewProps {
  data: VoiceIngestData;
  onCommit: (accepted: VoiceIngestData) => void;
  isCommitting: boolean;
}

type ElementCategory =
  | "stories"
  | "beliefs"
  | "patterns"
  | "frameworks"
  | "perspectives";

const categoryConfig: {
  key: ElementCategory;
  label: string;
  icon: typeof BookOpen;
  color: string;
}[] = [
  { key: "stories", label: "Stories", icon: BookOpen, color: "text-blue-500" },
  {
    key: "beliefs",
    label: "Beliefs",
    icon: Lightbulb,
    color: "text-amber-500",
  },
  {
    key: "frameworks",
    label: "Frameworks",
    icon: Wrench,
    color: "text-green-500",
  },
  {
    key: "perspectives",
    label: "Perspectives",
    icon: Eye,
    color: "text-purple-500",
  },
  { key: "patterns", label: "Patterns", icon: Music, color: "text-pink-500" },
];

function getItemTitle(category: ElementCategory, item: unknown): string {
  const obj = item as Record<string, unknown>;
  if (category === "stories") {
    const arc = obj.narrative_arc as Record<string, unknown> | undefined;
    return (
      (obj.internal_title as string) ??
      (arc?.title as string) ??
      "Untitled Story"
    );
  }
  if (category === "beliefs")
    return (obj.belief_statement as string) ?? "Untitled Belief";
  if (category === "frameworks")
    return (obj.name as string) ?? "Untitled Framework";
  if (category === "perspectives")
    return (obj.label as string) ?? "Untitled Perspective";
  if (category === "patterns")
    return (obj.pattern_name as string) ?? "Untitled Pattern";
  return "Unknown";
}

function getItemDescription(
  category: ElementCategory,
  item: unknown
): string | null {
  const obj = item as Record<string, unknown>;
  if (category === "stories") {
    const arc = obj.narrative_arc as Record<string, unknown> | undefined;
    return (arc?.the_setup as string) ?? null;
  }
  if (category === "beliefs") return (obj.why_it_matters as string) ?? null;
  if (category === "frameworks") return (obj.description as string) ?? null;
  if (category === "perspectives") return (obj.stance as string) ?? null;
  if (category === "patterns") return (obj.description as string) ?? null;
  return null;
}

export function ExtractionReview({
  data,
  onCommit,
  isCommitting,
}: ExtractionReviewProps) {
  const [rejected, setRejected] = useState<Set<string>>(new Set());

  const categories = categoryConfig.filter(
    (c) => data[c.key] && (data[c.key] as unknown[]).length > 0
  );

  const totalItems = categories.reduce(
    (sum, c) => sum + (data[c.key] as unknown[]).length,
    0
  );
  const acceptedCount = totalItems - rejected.size;

  function toggleReject(key: string) {
    setRejected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleAcceptAll() {
    setRejected(new Set());
  }

  function handleRejectAll() {
    const all = new Set<string>();
    categories.forEach((c) => {
      (data[c.key] as unknown[]).forEach((_, i) => {
        all.add(`${c.key}-${i}`);
      });
    });
    setRejected(all);
  }

  function handleCommit() {
    const accepted: VoiceIngestData = {};
    categories.forEach((c) => {
      const items = (data[c.key] as unknown[]).filter(
        (_, i) => !rejected.has(`${c.key}-${i}`)
      );
      if (items.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (accepted as any)[c.key] = items;
      }
    });
    onCommit(accepted);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Review Extracted Elements</h3>
          <p className="text-xs text-muted-foreground">
            {acceptedCount} of {totalItems} accepted
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAcceptAll}>
            Accept All
          </Button>
          <Button variant="outline" size="sm" onClick={handleRejectAll}>
            Reject All
          </Button>
        </div>
      </div>

      {categories.map((cat) => {
        const items = data[cat.key] as unknown[];
        return (
          <div key={cat.key}>
            <div className="flex items-center gap-1.5 mb-2">
              <cat.icon className={`h-4 w-4 ${cat.color}`} />
              <span className="text-xs font-medium">{cat.label}</span>
              <Badge variant="secondary" className="text-[10px]">
                {items.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {items.map((item, i) => {
                const key = `${cat.key}-${i}`;
                const isRejected = rejected.has(key);
                const title = getItemTitle(cat.key, item);
                const desc = getItemDescription(cat.key, item);

                return (
                  <Card
                    key={key}
                    className={
                      isRejected ? "opacity-40 border-dashed" : undefined
                    }
                  >
                    <CardContent className="py-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{title}</p>
                        {desc && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {desc}
                          </p>
                        )}
                      </div>
                      <Button
                        variant={isRejected ? "outline" : "ghost"}
                        size="icon"
                        className="shrink-0 h-7 w-7"
                        onClick={() => toggleReject(key)}
                      >
                        {isRejected ? (
                          <X className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Separator className="mt-4" />
          </div>
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
          ? "Committing to Profile..."
          : `Commit ${acceptedCount} Elements to Profile`}
      </Button>
    </div>
  );
}

// ─── Summary after successful commit ─────────────────────────

interface CommitSummaryProps {
  categories: string[];
  onReset: () => void;
}

export function CommitSummary({ categories, onReset }: CommitSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2 text-green-600">
          <Check className="h-4 w-4" />
          Voice Profile Updated
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Successfully committed elements to the following categories:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <Badge key={cat} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Your Authority Packets and Gap Analysis will automatically update to
          reflect the new voice data.
        </p>
        <Button onClick={onReset} variant="outline" className="w-full">
          Mine More Content
        </Button>
      </CardContent>
    </Card>
  );
}
