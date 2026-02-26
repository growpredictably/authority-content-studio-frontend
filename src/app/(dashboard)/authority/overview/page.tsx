"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { useAuthor } from "@/hooks/use-author";
import { usePackets, useGapAnalysis } from "@/lib/api/hooks/use-authority";
import { AuthorityScore } from "@/components/command-center/authority-score";
import { AuthorityOverviewStats } from "@/components/authority/authority-overview-stats";
import { PacketHealthSummary } from "@/components/authority/packet-health-summary";
import { GapSummaryCard } from "@/components/authority/gap-summary-card";

export default function AuthorityOverviewPage() {
  const { author, isLoading: authorLoading } = useAuthor();
  const { data: packets, isLoading: packetsLoading } = usePackets(author?.id);
  const { data: gaps, isLoading: gapsLoading } = useGapAnalysis(author?.id);

  const isLoading = authorLoading || packetsLoading || gapsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Authority Engine</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-52 rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {author && <AuthorityScore authorId={author.id} />}

          <AuthorityOverviewStats packets={packets} gaps={gaps} />

          <div className="grid gap-4 md:grid-cols-2">
            <PacketHealthSummary packets={packets} />
            <GapSummaryCard gaps={gaps} />
          </div>
        </>
      )}
    </div>
  );
}
