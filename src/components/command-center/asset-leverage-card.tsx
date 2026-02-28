"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, ArrowRight, Package, FileText, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useLeverage } from "@/lib/api/hooks/use-command-center";

interface AssetLeverageCardProps {
  authorId: string;
}

export function AssetLeverageCard({ authorId }: AssetLeverageCardProps) {
  const { data, isLoading } = useLeverage(authorId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { metrics, packet_flow } = data;
  const hasAssets = packet_flow.total_packets > 0 || metrics.external_knowledge_count > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          Asset Leverage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CTA Message */}
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
          <p className="text-sm font-medium">
            {metrics.leverage_message}
          </p>
        </div>

        {hasAssets && (
          <>
            {/* Content potential breakdown */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Package className="h-3 w-3" />
                </div>
                <p className="text-lg font-bold tabular-nums">
                  {metrics.ready_packets}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Ready Packets
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <FileText className="h-3 w-3" />
                </div>
                <p className="text-lg font-bold tabular-nums">
                  {metrics.potential_articles}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Potential Articles
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <MessageSquare className="h-3 w-3" />
                </div>
                <p className="text-lg font-bold tabular-nums">
                  {metrics.potential_posts}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Potential Posts
                </p>
              </div>
            </div>

            {/* Packet flow summary */}
            {metrics.calibrating_packets > 0 && (
              <p className="text-xs text-muted-foreground">
                {metrics.calibrating_packets} packet{metrics.calibrating_packets !== 1 ? "s" : ""} still calibrating
                {metrics.draft_themes > 0 && `, ${metrics.draft_themes} draft theme${metrics.draft_themes !== 1 ? "s" : ""}`}
              </p>
            )}
          </>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {metrics.calibrating_packets > 0 || metrics.draft_themes > 0 ? (
            <Button size="sm" variant="outline" className="flex-1 gap-1" asChild>
              <Link href="/authority/gaps">
                Strengthen Packets
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="flex-1 gap-1" asChild>
              <Link href="/authority/packets">
                View Packets
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
