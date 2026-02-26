"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, TrendingUp, Sparkles } from "lucide-react";
import type { GapAnalysisResponse } from "@/lib/api/types";

interface GapSummaryCardProps {
  gaps: GapAnalysisResponse | undefined;
}

export function GapSummaryCard({ gaps }: GapSummaryCardProps) {
  const summary = gaps?.summary;

  const items = [
    {
      label: "High Priority Actions",
      value: summary?.high_priority_actions ?? 0,
      icon: Zap,
      color: "text-red-500",
    },
    {
      label: "Improvable Packets",
      value: summary?.packets_improvable ?? 0,
      icon: TrendingUp,
      color: "text-amber-500",
    },
    {
      label: "New Packet Potential",
      value: summary?.new_packets_potential ?? 0,
      icon: Sparkles,
      color: "text-blue-500",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Gap Analysis</CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
            <Link href="/authority/gaps">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <item.icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-xs text-muted-foreground">
                {item.label}
              </span>
            </div>
            <Badge variant="secondary" className="tabular-nums text-xs">
              {item.value}
            </Badge>
          </div>
        ))}

        {summary && (
          <div className="pt-2 border-t">
            <p className="text-[10px] text-muted-foreground">
              Estimated utilization after fixes:{" "}
              <span className="font-medium tabular-nums">
                {Math.round(summary.estimated_utilization_after_fixes * 100)}%
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
