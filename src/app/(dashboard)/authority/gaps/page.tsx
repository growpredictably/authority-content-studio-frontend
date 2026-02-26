"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";
import { useAuthor } from "@/hooks/use-author";
import { useGapAnalysis } from "@/lib/api/hooks/use-authority";
import { DnaUtilizationOverview } from "@/components/authority/dna-utilization-overview";
import { PrioritizedActionsTabs } from "@/components/authority/prioritized-actions-tabs";
import { PotentialThemesSection } from "@/components/authority/potential-themes-section";
import { GapRemediateDialog } from "@/components/authority/gap-remediate-dialog";
import type { PacketGap } from "@/lib/api/types";

export default function GapsPage() {
  const { author } = useAuthor();
  const { data, isLoading } = useGapAnalysis(author?.id);
  const [remediateGap, setRemediateGap] = useState<PacketGap | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Target className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Gap Analysis</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : !data ? (
        <div className="text-center py-16 space-y-3">
          <Target className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">
            No gap analysis available yet. Build your authority packets first.
          </p>
        </div>
      ) : (
        <>
          <DnaUtilizationOverview utilization={data.dna_utilization} />

          <PrioritizedActionsTabs
            groupedGaps={data.grouped_gaps}
            authorId={data.author_id}
            onRemediate={setRemediateGap}
          />

          <PotentialThemesSection themes={data.potential_themes} />
        </>
      )}

      {author && (
        <GapRemediateDialog
          gap={remediateGap}
          authorId={author.id}
          open={!!remediateGap}
          onOpenChange={(open) => !open && setRemediateGap(null)}
        />
      )}
    </div>
  );
}
