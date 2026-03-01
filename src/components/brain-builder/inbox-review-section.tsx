"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Inbox, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  useInbox,
  useApproveInboxItem,
  useRejectInboxItem,
} from "@/lib/api/hooks/use-inbox";
import type { InboxItem } from "@/lib/api/types";

interface InboxReviewSectionProps {
  authorId: string | undefined;
  userId: string | undefined;
}

function InboxReviewCard({
  item,
  userId,
  authorId,
}: {
  item: InboxItem;
  userId: string;
  authorId: string;
}) {
  const approve = useApproveInboxItem();
  const reject = useRejectInboxItem();

  const isPending = approve.isPending || reject.isPending;

  function handleApprove() {
    approve.mutate(
      { inbox_item_id: item.id, user_id: userId, author_id: authorId },
      {
        onSuccess: () => toast.success("Knowledge approved and added to Brain"),
        onError: () => toast.error("Failed to approve item"),
      }
    );
  }

  function handleReject() {
    reject.mutate(
      { inbox_item_id: item.id, user_id: userId, author_id: authorId },
      {
        onSuccess: () => toast.success("Item rejected"),
        onError: () => toast.error("Failed to reject item"),
      }
    );
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {item.source_title && (
              <p className="text-sm font-medium">{item.source_title}</p>
            )}
            {item.author && (
              <p className="text-xs text-muted-foreground">by {item.author}</p>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {item.status}
          </Badge>
        </div>

        {item.core_principle && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground">
              Core Principle
            </p>
            <p className="text-xs">{item.core_principle}</p>
          </div>
        )}

        {item.contrarian_insight && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground">
              Contrarian Insight
            </p>
            <p className="text-xs">{item.contrarian_insight}</p>
          </div>
        )}

        {item.direct_quote && (
          <p className="text-[10px] text-muted-foreground border-l-2 border-muted pl-2 italic">
            &ldquo;{item.direct_quote}&rdquo;
          </p>
        )}

        {item.dna_resonance && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground">
              DNA Connection
            </p>
            <p className="text-xs">{item.dna_resonance}</p>
          </div>
        )}

        {item.hook_angle && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground">
              Hook Angle
            </p>
            <p className="text-xs">{item.hook_angle}</p>
          </div>
        )}

        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary flex items-center gap-0.5 hover:underline"
          >
            View source <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={handleApprove}
            disabled={isPending}
          >
            {approve.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Check className="h-3 w-3 mr-1" />
            )}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs flex-1"
            onClick={handleReject}
            disabled={isPending}
          >
            {reject.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <X className="h-3 w-3 mr-1" />
            )}
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function InboxReviewSection({
  authorId,
  userId,
}: InboxReviewSectionProps) {
  const { data, isLoading } = useInbox(authorId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <Inbox className="h-10 w-10 mx-auto text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          No pending items in your inbox.
        </p>
        <p className="text-xs text-muted-foreground">
          AI-suggested knowledge will appear here for your review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <InboxReviewCard
          key={item.id}
          item={item}
          userId={userId ?? ""}
          authorId={authorId ?? ""}
        />
      ))}
    </div>
  );
}
