"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dna, Package, Brain, TrendingUp } from "lucide-react";
import { useLeverage } from "@/lib/api/hooks/use-command-center";

interface QuickStatsProps {
  authorId: string;
}

export function QuickStats({ authorId }: QuickStatsProps) {
  const { data, isLoading } = useLeverage(authorId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-24 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { metrics, packet_flow } = data;

  const stats = [
    {
      label: "DNA Elements",
      value:
        (metrics.ready_packets + metrics.calibrating_packets + metrics.draft_themes) > 0
          ? `${metrics.ready_packets + metrics.calibrating_packets + metrics.draft_themes}`
          : "0",
      subtitle: `${metrics.ready_packets} ready, ${metrics.calibrating_packets} calibrating`,
      icon: Dna,
      tooltip: `${packet_flow.total_packets} total packets across all stages`,
    },
    {
      label: "Authority Packets",
      value: String(packet_flow.total_packets),
      subtitle: Object.entries(packet_flow.by_stage || {})
        .map(([stage, count]) => `${count} ${stage}`)
        .join(", ") || "None yet",
      icon: Package,
      tooltip: "Packets organized by readiness stage",
    },
    {
      label: "Brain Items",
      value: String(metrics.external_knowledge_count),
      subtitle: Object.entries(metrics.brain_by_endorsement || {})
        .map(([level, count]) => `${count} ${level}`)
        .join(", ") || "None yet",
      icon: Brain,
      tooltip: "External knowledge items endorsed in Brain Builder",
    },
    {
      label: "Content Potential",
      value: String(metrics.total_potential_content),
      subtitle: metrics.leverage_message || `${metrics.potential_articles} articles, ${metrics.potential_posts} posts`,
      icon: TrendingUp,
      tooltip: "Estimated content output from your current DNA assets",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <Tooltip key={stat.label}>
          <TooltipTrigger asChild>
            <Card className="cursor-default">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <stat.icon className="h-3.5 w-3.5" />
                  {stat.label}
                </div>
                <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>{stat.tooltip}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
