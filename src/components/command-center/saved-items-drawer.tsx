"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bookmark, Trash2, Link2, Lightbulb, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  useSavedActions,
  useDismissSavedAction,
} from "@/lib/api/hooks/use-command-center";
import type { SavedAction } from "@/lib/api/types";

interface SavedItemsDrawerProps {
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

export function SavedItemsDrawer({ authorId }: SavedItemsDrawerProps) {
  const { data } = useSavedActions(authorId);
  const dismiss = useDismissSavedAction();

  const count = data?.saved_actions?.length ?? 0;

  function handleDismiss(id: string) {
    dismiss.mutate(id, {
      onSuccess: () => toast.success("Removed from saved items"),
      onError: () => toast.error("Failed to remove item"),
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Bookmark className="h-3.5 w-3.5" />
          Saved
          {count > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {count}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Saved Actions
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {count === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No saved actions yet. Bookmark sync actions to revisit them later.
            </p>
          ) : (
            data?.saved_actions.map((saved) => (
              <SavedItem
                key={saved.id}
                saved={saved}
                onDismiss={() => handleDismiss(saved.id)}
                isDismissing={dismiss.isPending}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SavedItem({
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
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <Badge className={`text-xs ${color}`}>
          <Icon className="h-3 w-3 mr-1" />
          {label}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={onDismiss}
          disabled={isDismissing}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-sm font-medium leading-snug">{action.headline}</p>
      {action.prompt && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {action.prompt}
        </p>
      )}
      {saved.note && (
        <>
          <Separator />
          <p className="text-xs italic text-muted-foreground">{saved.note}</p>
        </>
      )}
      <p className="text-[10px] text-muted-foreground">
        Saved {new Date(saved.saved_at).toLocaleDateString()}
      </p>
    </div>
  );
}
