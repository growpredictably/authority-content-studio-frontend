"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useRemediateGap } from "@/lib/api/hooks/use-authority";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import type { PacketGap, RemediateGapResponse } from "@/lib/api/types";

interface GapRemediateDialogProps {
  gap: PacketGap | null;
  authorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GapRemediateDialog({
  gap,
  authorId,
  open,
  onOpenChange,
}: GapRemediateDialogProps) {
  const [content, setContent] = useState("");
  const [result, setResult] = useState<RemediateGapResponse | null>(null);
  const remediate = useRemediateGap();

  function handleSubmit() {
    if (!gap || !content.trim()) return;

    remediate.mutate(
      {
        author_id: authorId,
        gap_action_id: gap.gap_action_id ?? gap.packet_id,
        content: content.trim(),
        source: "inline_fix",
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

  function handleClose(open: boolean) {
    if (!open) {
      setContent("");
      setResult(null);
    }
    onOpenChange(open);
  }

  if (!gap) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            Fix: {gap.theme}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Respond to this prompt:
            </p>
            <p className="text-sm italic border-l-2 border-primary/30 pl-3">
              {gap.voice_builder_prompt}
            </p>
          </div>

          {!result ? (
            <>
              <Textarea
                placeholder="Share your thoughts, experiences, or insights..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={remediate.isPending}
                rows={6}
              />
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || remediate.isPending}
                className="w-full gap-2"
              >
                {remediate.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {remediate.isPending ? "Processing..." : "Submit & Extract"}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Authority Strength Change
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">
                    {Math.round(result.coherence_before * 100)}%
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-sm font-semibold tabular-nums text-green-600">
                    {Math.round(result.coherence_after * 100)}%
                  </span>
                </div>
                <Progress
                  value={result.coherence_after * 100}
                  className="h-1.5"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {result.message}
              </p>

              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                className="w-full"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
