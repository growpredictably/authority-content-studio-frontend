"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Radar,
  Search,
  ExternalLink,
  BookPlus,
  Loader2,
  Shield,
  Swords,
} from "lucide-react";
import { toast } from "sonner";
import { useRadarScan } from "@/lib/api/hooks/use-command-center";
import type { RadarEvidenceItem } from "@/lib/api/types";

interface ActiveRadarCardProps {
  authorId: string;
}

export function ActiveRadarCard({ authorId }: ActiveRadarCardProps) {
  const [beliefText, setBeliefText] = useState("");
  const [scanType, setScanType] = useState<"evidence" | "counter">("evidence");
  const radarScan = useRadarScan();

  function handleScan() {
    if (!beliefText.trim()) return;

    radarScan.mutate(
      {
        author_id: authorId,
        belief_text: beliefText.trim(),
        scan_type: scanType,
        max_results: 5,
      },
      {
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Radar scan failed"
          ),
      }
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radar className="h-4 w-4" />
          Active Radar
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Search for evidence that supports or challenges your beliefs
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Enter a belief or claim to investigate..."
              value={beliefText}
              onChange={(e) => setBeliefText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleScan}
              disabled={radarScan.isPending || !beliefText.trim()}
            >
              {radarScan.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Scan type toggle */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={scanType === "evidence" ? "default" : "outline"}
              onClick={() => setScanType("evidence")}
              className="gap-1.5 text-xs h-7"
            >
              <Shield className="h-3 w-3" />
              Supporting
            </Button>
            <Button
              size="sm"
              variant={scanType === "counter" ? "default" : "outline"}
              onClick={() => setScanType("counter")}
              className="gap-1.5 text-xs h-7"
            >
              <Swords className="h-3 w-3" />
              Counter
            </Button>
          </div>
        </div>

        {/* Results */}
        {radarScan.data && (
          <>
            <Separator />

            {/* Summary */}
            {radarScan.data.summary && (
              <p className="text-sm text-muted-foreground">
                {radarScan.data.summary}
              </p>
            )}

            {/* Evidence list */}
            {radarScan.data.evidence_items.length > 0 ? (
              <div className="space-y-2">
                {radarScan.data.evidence_items.map((item, i) => (
                  <EvidenceItem key={i} item={item} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {radarScan.data.message}
              </p>
            )}

            {/* Brain Builder CTA */}
            {radarScan.data.curate_candidates.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5"
                onClick={() =>
                  toast.info(
                    "Navigate to Brain Builder to curate these findings"
                  )
                }
              >
                <BookPlus className="h-3 w-3" />
                Add {radarScan.data.curate_candidates.length} to Brain Builder
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EvidenceItem({ item }: { item: RadarEvidenceItem }) {
  const relevancePercent = Math.round(item.relevance_score * 100);

  return (
    <div className="rounded-lg border p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {item.source_title}
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="shrink-0 text-xs tabular-nums">
              {relevancePercent}%
            </Badge>
          </TooltipTrigger>
          <TooltipContent>Relevance score</TooltipContent>
        </Tooltip>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {item.snippet}
      </p>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-[10px]">
          {item.evidence_type}
        </Badge>
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
        >
          <ExternalLink className="h-2.5 w-2.5" />
          Source
        </a>
      </div>
    </div>
  );
}
