"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  Activity,
  Dna,
  AlertTriangle,
} from "lucide-react";
import type { PacketsListResponse, GapAnalysisResponse } from "@/lib/api/types";

interface AuthorityOverviewStatsProps {
  packets: PacketsListResponse | undefined;
  gaps: GapAnalysisResponse | undefined;
}

export function AuthorityOverviewStats({
  packets,
  gaps,
}: AuthorityOverviewStatsProps) {
  const totalPackets = packets?.summary.total ?? 0;

  const avgCoherence = packets?.packets.length
    ? Math.round(
        (packets.packets.reduce((sum, p) => sum + p.coherence_score, 0) /
          packets.packets.length) *
          100
      )
    : 0;

  const dnaUtilization = gaps
    ? Math.round(gaps.dna_utilization.overall * 100)
    : 0;

  const openActions = gaps?.summary.high_priority_actions ?? 0;

  const stats = [
    {
      label: "Total Packets",
      value: totalPackets,
      icon: Package,
      description: `${packets?.summary.complete ?? 0} complete`,
    },
    {
      label: "Avg Coherence",
      value: `${avgCoherence}%`,
      icon: Activity,
      description: avgCoherence >= 70 ? "Healthy" : "Needs attention",
    },
    {
      label: "DNA Utilization",
      value: `${dnaUtilization}%`,
      icon: Dna,
      description: `${gaps?.dna_utilization.overall_used ?? 0} of ${gaps?.dna_utilization.overall_total ?? 0} elements`,
    },
    {
      label: "Open Actions",
      value: openActions,
      icon: AlertTriangle,
      description: `${gaps?.summary.groups.quick_wins ?? 0} quick wins`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold tabular-nums">
                  {stat.value}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
