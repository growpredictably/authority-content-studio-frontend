"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link2, Lightbulb, MessageSquare, ArrowRight, Zap, Minus, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCompleteAction, useSaveAction } from "@/lib/api/hooks/use-command-center";
import { ClarifyActionDrawer } from "./clarify-action-drawer";
import type { SyncAction } from "@/lib/api/types";

const typeConfig = {
  sync: {
    label: "Connect the Dots",
    icon: Link2,
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  clarify: {
    label: "Strengthen",
    icon: Lightbulb,
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  decide: {
    label: "Take a Stand",
    icon: MessageSquare,
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
};

interface SyncCardProps {
  action: SyncAction;
  authorId: string;
  sessionId: string;
  onCompleted: () => void;
}

export function SyncCard({
  action,
  authorId,
  sessionId,
  onCompleted,
}: SyncCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resolved, setResolved] = useState(false);

  const completeAction = useCompleteAction();
  const saveAction = useSaveAction();
  const config = typeConfig[action.action_type];
  const Icon = config.icon;

  function handleSave() {
    saveAction.mutate(
      { author_id: authorId, action_payload: action },
      {
        onSuccess: () => toast.success("Saved for later"),
        onError: () => toast.error("Failed to save"),
      }
    );
  }

  function handleComplete(
    result: "accepted" | "rejected" | "skipped",
    userResponse?: Record<string, unknown>
  ) {
    completeAction.mutate(
      {
        author_id: authorId,
        action_id: action.action_id,
        session_id: sessionId,
        result,
        user_response: userResponse,
      },
      {
        onSuccess: (data) => {
          toast.success(data.message || "Action completed");
          setResolved(true);
          setTimeout(onCompleted, 400);
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to complete action"
          ),
      }
    );
  }

  const isActioning = completeAction.isPending;

  return (
    <AnimatePresence>
      {!resolved && (
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="h-full">
            <CardContent className="pt-6 space-y-3">
              {/* Domain + Impact badges + Save */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Badge className={cn("text-xs", config.color)}>
                    <Icon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                  {action.priority <= 1 && (
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-200 dark:border-orange-800 dark:text-orange-400">
                      <Zap className="h-3 w-3 mr-0.5" />
                      High Impact
                    </Badge>
                  )}
                  {action.priority === 2 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      <Minus className="h-3 w-3 mr-0.5" />
                      Med
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                  onClick={handleSave}
                  disabled={saveAction.isPending}
                  title="Save for later"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Headline */}
              <p className="text-sm font-medium leading-snug">
                {action.headline}
              </p>

              {/* Type-specific content */}
              {action.action_type === "sync" && (
                <SyncContent action={action} />
              )}
              {action.action_type === "clarify" && (
                <ClarifyContent action={action} />
              )}
              {action.action_type === "decide" && (
                <DecideContent action={action} />
              )}

              {/* Effort estimate */}
              {action.effort_minutes && (
                <p className="text-[10px] text-muted-foreground">
                  ~{action.effort_minutes} min
                </p>
              )}

              <Separator />

              {/* Actions */}
              {action.action_type === "sync" && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleComplete("accepted", { linked: true })}
                    disabled={isActioning}
                    className="flex-1 gap-1"
                  >
                    Yes, Connected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleComplete("rejected", { linked: false })
                    }
                    disabled={isActioning}
                    className="flex-1"
                  >
                    No
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleComplete("skipped")}
                    disabled={isActioning}
                  >
                    Skip
                  </Button>
                </div>
              )}

              {action.action_type === "clarify" && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setDrawerOpen(true)}
                    disabled={isActioning}
                    className="flex-1"
                  >
                    Answer Now
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleComplete("skipped")}
                    disabled={isActioning}
                  >
                    Skip
                  </Button>
                  <ClarifyActionDrawer
                    action={action}
                    open={drawerOpen}
                    onOpenChange={setDrawerOpen}
                    onSubmit={(answer) => {
                      handleComplete("accepted", { answer });
                      setDrawerOpen(false);
                    }}
                    onSkip={() => {
                      handleComplete("skipped");
                      setDrawerOpen(false);
                    }}
                    isPending={isActioning}
                  />
                </div>
              )}

              {action.action_type === "decide" && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      handleComplete("accepted", { stance: "agree" })
                    }
                    disabled={isActioning}
                    className="flex-1"
                  >
                    Agree
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      handleComplete("accepted", { stance: "disagree" })
                    }
                    disabled={isActioning}
                    className="flex-1"
                  >
                    Disagree
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleComplete("skipped")}
                    disabled={isActioning}
                  >
                    Skip
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SyncContent({ action }: { action: SyncAction }) {
  const elementATitle =
    (action.element_a?.title as string) ||
    (action.element_a?.name as string) ||
    "Element A";
  const elementBTitle =
    (action.element_b?.title as string) ||
    (action.element_b?.name as string) ||
    "Element B";

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{action.description}</p>
      <div className="flex items-center gap-2 text-xs">
        <span className="rounded bg-muted px-2 py-1 font-medium truncate max-w-[45%]">
          {elementATitle}
        </span>
        <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="rounded bg-muted px-2 py-1 font-medium truncate max-w-[45%]">
          {elementBTitle}
        </span>
      </div>
    </div>
  );
}

function ClarifyContent({ action }: { action: SyncAction }) {
  return (
    <div className="space-y-2">
      {action.gap_type && (
        <Badge variant="outline" className="text-xs">
          {action.gap_type}
        </Badge>
      )}
      <p className="text-xs text-muted-foreground">{action.prompt}</p>
      {action.impact_delta && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {(action.impact_delta.before * 100).toFixed(0)}%
          </span>
          <ArrowRight className="h-3 w-3" />
          <span className="tabular-nums font-medium text-foreground">
            {(action.impact_delta.after * 100).toFixed(0)}%
          </span>
          <span>coherence</span>
        </div>
      )}
    </div>
  );
}

function DecideContent({ action }: { action: SyncAction }) {
  return (
    <div className="space-y-2">
      <blockquote className="border-l-2 border-primary/30 pl-3 text-xs italic text-muted-foreground">
        {action.prompt}
      </blockquote>
      {action.rationale && (
        <p className="text-[10px] text-muted-foreground">
          {action.rationale}
        </p>
      )}
    </div>
  );
}
