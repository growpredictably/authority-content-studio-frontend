"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, Wrench } from "lucide-react";
import { useGapAnalysis, useRemediateGap } from "@/lib/api/hooks/use-authority";
import { toast } from "sonner";
import type { PacketGap, RemediateGapResponse } from "@/lib/api/types";

interface PacketFixDrawerProps {
  packetId: string | null;
  packetTheme: string;
  authorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PacketFixDrawer({
  packetId,
  packetTheme,
  authorId,
  open,
  onOpenChange,
}: PacketFixDrawerProps) {
  const { data: gapData } = useGapAnalysis(authorId);
  const remediate = useRemediateGap();
  const [activeGapId, setActiveGapId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [result, setResult] = useState<RemediateGapResponse | null>(null);

  const packetGaps = (gapData?.packet_gaps ?? []).filter(
    (g) => g.packet_id === packetId
  );

  function handleSubmit(gap: PacketGap) {
    if (!content.trim()) return;
    remediate.mutate(
      {
        author_id: authorId,
        gap_action_id: gap.gap_action_id ?? gap.packet_id,
        content: content.trim(),
        source: "packet_detail_fix",
      },
      {
        onSuccess: (data) => {
          setResult(data);
          toast.success(
            data.gap_resolved
              ? "Gap resolved!"
              : "Content extracted — gap partially addressed"
          );
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to remediate gap"
          );
        },
      }
    );
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setActiveGapId(null);
      setContent("");
      setResult(null);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <SheetTitle className="text-left">Fix Missing Elements</SheetTitle>
          </div>
          <SheetDescription className="text-left">
            {packetTheme} — {packetGaps.length} gap
            {packetGaps.length !== 1 ? "s" : ""} found
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {packetGaps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No gaps found for this packet. It may already be complete.
            </p>
          ) : (
            packetGaps.map((gap, idx) => {
              const gapId = gap.gap_action_id ?? gap.packet_id;
              const isActive = activeGapId === gapId;

              return (
                <div key={gapId + gap.gap_type + idx}>
                  {idx > 0 && <Separator />}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {gap.gap_type.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {gap.blocking_element}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {gap.diagnosis}
                    </p>

                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-sm italic">
                        {gap.voice_builder_prompt}
                      </p>
                    </div>

                    {isActive ? (
                      result ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="tabular-nums">
                              {Math.round(result.coherence_before * 100)}%
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-semibold text-green-600 tabular-nums">
                              {Math.round(result.coherence_after * 100)}%
                            </span>
                          </div>
                          <Progress
                            value={result.coherence_after * 100}
                            className="h-1.5"
                          />
                          <p className="text-xs text-muted-foreground">
                            {result.message}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Share your thoughts, experiences, or insights..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={remediate.isPending}
                            rows={4}
                          />
                          <Button
                            onClick={() => handleSubmit(gap)}
                            disabled={!content.trim() || remediate.isPending}
                            className="w-full gap-2"
                            size="sm"
                          >
                            {remediate.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                            {remediate.isPending
                              ? "Processing..."
                              : "Submit & Extract"}
                          </Button>
                        </div>
                      )
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full gap-1"
                        onClick={() => {
                          setActiveGapId(gapId);
                          setContent("");
                          setResult(null);
                        }}
                      >
                        <Wrench className="h-3 w-3" />
                        Fix This Gap
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
