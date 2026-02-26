"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { PacketsListResponse } from "@/lib/api/types";

interface PacketHealthSummaryProps {
  packets: PacketsListResponse | undefined;
}

export function PacketHealthSummary({ packets }: PacketHealthSummaryProps) {
  const allPackets = packets?.packets ?? [];
  const total = allPackets.length || 1;

  const stages = [
    {
      label: "Flagship",
      key: "ready" as const,
      count: allPackets.filter((p) => p.readiness_stage === "ready").length,
      color: "bg-green-500",
    },
    {
      label: "Core",
      key: "calibrating" as const,
      count: allPackets.filter((p) => p.readiness_stage === "calibrating")
        .length,
      color: "bg-amber-500",
    },
    {
      label: "Emerging",
      key: "draft" as const,
      count: allPackets.filter((p) => p.readiness_stage === "draft").length,
      color: "bg-gray-400",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Packet Health</CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
            <Link href="/authority/packets">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.map((stage) => {
          const pct = Math.round((stage.count / total) * 100);
          return (
            <div key={stage.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{stage.label}</span>
                <span className="font-medium tabular-nums">
                  {stage.count} ({pct}%)
                </span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
