"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bookmark,
  Link2,
  Lightbulb,
  MessageSquare,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useSavedActions,
  useDismissSavedAction,
} from "@/lib/api/hooks/use-command-center";
import type { SavedAction } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface SavedForLaterProps {
  authorId: string;
}

const typeIcons = {
  sync: Link2,
  clarify: Lightbulb,
  decide: MessageSquare,
};

const typeLabels = {
  sync: "Connect the Dots",
  clarify: "Strengthen",
  decide: "Take a Stand",
};

const typeColors = {
  sync: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  clarify: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  decide: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
};

export function SavedForLater({ authorId }: SavedForLaterProps) {
  const { data } = useSavedActions(authorId);
  const dismiss = useDismissSavedAction();

  const items = data?.saved_actions ?? [];
  if (items.length === 0) return null;

  function handleDismiss(id: string) {
    dismiss.mutate(id, {
      onSuccess: () => toast.success("Removed from saved items"),
      onError: () => toast.error("Failed to remove item"),
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bookmark className="h-4 w-4" />
          Saved for Later
          <Badge variant="secondary" className="ml-1 text-xs">
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((saved) => (
          <SavedItemCard
            key={saved.id}
            saved={saved}
            onDismiss={() => handleDismiss(saved.id)}
            isDismissing={dismiss.isPending}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function SavedItemCard({
  saved,
  onDismiss,
  isDismissing,
}: {
  saved: SavedAction;
  onDismiss: () => void;
  isDismissing: boolean;
}) {
  const action = saved.action_payload;
  const actionType = action.action_type as keyof typeof typeIcons;
  const Icon = typeIcons[actionType] ?? Link2;
  const label = typeLabels[actionType] ?? actionType;
  const color = typeColors[actionType] ?? "";

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Badge className={cn("text-xs", color)}>
            <Icon className="h-3 w-3 mr-1" />
            {label}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            Saved {new Date(saved.saved_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm font-medium leading-snug">{action.headline}</p>
        {action.prompt && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {action.prompt}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onDismiss}
        disabled={isDismissing}
        title="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
