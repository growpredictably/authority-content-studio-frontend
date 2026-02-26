"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdateOutcome } from "@/lib/api/hooks/use-content-sessions";
import type { ContentSession } from "@/lib/api/types";

interface OutcomeFormProps {
  session: ContentSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OutcomeForm({ session, open, onOpenChange }: OutcomeFormProps) {
  const updateOutcome = useUpdateOutcome();
  const [impressions, setImpressions] = useState("");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [reposts, setReposts] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");

  function handleOpen(isOpen: boolean) {
    if (isOpen && session) {
      setImpressions(session.impressions?.toString() ?? "");
      setLikes(session.likes?.toString() ?? "");
      setComments(session.comments?.toString() ?? "");
      setReposts(session.reposts?.toString() ?? "");
      setPublishedUrl(session.published_url ?? "");
    }
    onOpenChange(isOpen);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    updateOutcome.mutate(
      {
        sessionId: session.id,
        ...(impressions ? { impressions: parseInt(impressions, 10) } : {}),
        ...(likes ? { likes: parseInt(likes, 10) } : {}),
        ...(comments ? { comments: parseInt(comments, 10) } : {}),
        ...(reposts ? { reposts: parseInt(reposts, 10) } : {}),
        ...(publishedUrl ? { published_url: publishedUrl } : {}),
      },
      {
        onSuccess: () => {
          toast.success("Outcome saved");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to save outcome"
          );
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            Add LinkedIn Outcome
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Enter your LinkedIn analytics for &ldquo;
            {session?.title || "Untitled Draft"}&rdquo;
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Impressions</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={impressions}
                onChange={(e) => setImpressions(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Likes</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={likes}
                onChange={(e) => setLikes(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Comments</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reposts</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={reposts}
                onChange={(e) => setReposts(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Published URL (optional)</Label>
            <Input
              type="url"
              placeholder="https://linkedin.com/posts/..."
              value={publishedUrl}
              onChange={(e) => setPublishedUrl(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={updateOutcome.isPending}
          >
            {updateOutcome.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Save Outcome
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
