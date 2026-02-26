"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck } from "lucide-react";
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

        {completedIds.size > 0 && activeActions.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {completedIds.size} of {data.actions.length} actions completed
          </p>
        )}
      </CardContent>
    </Card>
  );
}
