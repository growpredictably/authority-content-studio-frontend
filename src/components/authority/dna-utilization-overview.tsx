"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { GapAnalysisResponse } from "@/lib/api/types";

interface DnaUtilizationOverviewProps {
  utilization: GapAnalysisResponse["dna_utilization"];
}

const categoryConfig = [
  { key: "story" as const, label: "Stories", color: "bg-blue-500" },
  { key: "belief" as const, label: "Beliefs", color: "bg-purple-500" },
  { key: "framework" as const, label: "Frameworks", color: "bg-green-500" },
  {
    key: "perspective" as const,
    label: "Perspectives",
    color: "bg-orange-500",
  },
];

export function DnaUtilizationOverview({
  utilization,
}: DnaUtilizationOverviewProps) {
  const overallPercent = Math.round(utilization.overall * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">DNA Utilization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold tabular-nums">
              {overallPercent}%
            </span>
            <span className="text-xs text-muted-foreground">
              {utilization.overall_used} / {utilization.overall_total} elements
              used
            </span>
          </div>
          <Progress value={overallPercent} className="h-2" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {categoryConfig.map(({ key, label }) => {
            const cat = utilization.by_category[key];
            if (!cat) return null;
            const percent = Math.round(cat.utilization * 100);
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium tabular-nums">
                    {cat.used}/{cat.total}
                  </span>
                </div>
                <Progress value={percent} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
