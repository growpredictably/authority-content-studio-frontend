"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import { useDailySync } from "@/lib/api/hooks/use-command-center";
import { StreakDisplay } from "./streak-display";
import { SyncCard } from "./sync-card";

interface DailySyncCardsProps {
  authorId: string;
}

export function DailySyncCards({ authorId }: DailySyncCardsProps) {
  const { data, isLoading, error } = useDailySync(authorId);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="h-4 w-4" />
            Daily Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="h-4 w-4" />
            Daily Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load daily sync actions. Try refreshing.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeActions = data.actions.filter(
    (a) => !completedIds.has(a.action_id)
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="h-4 w-4" />
              Daily Sync
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {data.greeting}
            </p>
          </div>
          <StreakDisplay stats={data.habit_stats} />
        </div>
      </CardHeader>
      <CardContent>
        {activeActions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {activeActions.map((action) => (
              <SyncCard
                key={action.action_id}
                action={action}
                authorId={authorId}
                sessionId={data.session_id}
                onCompleted={() =>
                  setCompletedIds((prev) =>
                    new Set(prev).add(action.action_id)
                  )
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
            <p className="text-sm text-muted-foreground">
              {completedIds.size > 0
                ? `All ${completedIds.size} actions completed for today!`
                : "No sync actions available. Build more DNA to unlock daily actions."}
            </p>
          </div>
        )}

        {completedIds.size > 0 && data.actions.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {completedIds.size} of {data.actions.length} actions completed
              </span>
              <span className="tabular-nums font-medium">
                {Math.round((completedIds.size / data.actions.length) * 100)}%
              </span>
            </div>
            <Progress
              value={(completedIds.size / data.actions.length) * 100}
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
