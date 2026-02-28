"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Radar, Search, ExternalLink, BookmarkPlus, Zap, ShieldAlert } from "lucide-react";
import { useAuthor } from "@/hooks/use-author";
import { useRadarScan } from "@/lib/api/hooks/use-evidence";
import { useCommitKnowledge } from "@/lib/api/hooks/use-brain-builder";
import { cn } from "@/lib/utils";
import type { RadarEvidenceItem } from "@/lib/api/types";

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  statistic: { label: "Statistic", color: "bg-blue-100 text-blue-700" },
  study: { label: "Study", color: "bg-purple-100 text-purple-700" },
  expert_opinion: { label: "Expert Opinion", color: "bg-amber-100 text-amber-700" },
  counter_argument: { label: "Counter", color: "bg-red-100 text-red-700" },
};

export default function EvidenceFeedPage() {
  const { author, isLoading: authorLoading } = useAuthor();
  const scan = useRadarScan();
  const commitKnowledge = useCommitKnowledge();

  const [topic, setTopic] = useState("");
  const [scanType, setScanType] = useState<"evidence" | "counter">("evidence");
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  function handleScan() {
    if (!author || !topic.trim()) return;
    scan.mutate({
      author_id: author.id,
      belief_text: topic.trim(),
      scan_type: scanType,
      max_results: 8,
    });
  }

  function handleSaveToBrain(item: RadarEvidenceItem, idx: number) {
    if (!author || !scan.data) return;
    const candidate = scan.data.curate_candidates[idx];
    if (!candidate) return;

    commitKnowledge.mutate(
      {
        author_id: author.id,
        items: [
          {
            title: item.source_title,
            summary: item.snippet,
            key_quotes: [],
            endorsement_level: scanType === "counter" ? "anti_model" : "reference",
            strategic_tags: [item.evidence_type, scanType],
            source_url: item.source_url,
            source_title: item.source_title,
            source_type: "article",
          },
        ],
      },
      {
        onSuccess: () => {
          setSavedIds((prev) => new Set(prev).add(idx));
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Radar className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Evidence Feed</h1>
      </div>

      <p className="text-sm text-muted-foreground max-w-2xl">
        Search the web for statistics, studies, and expert opinions that support
        (or challenge) your authority positions. Save the best finds directly to
        your Brain.
      </p>

      {/* ─── Search Bar ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Enter a topic or belief to search for evidence..."
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setScanType("evidence")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm transition-colors",
              scanType === "evidence"
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            Supporting
          </button>
          <button
            onClick={() => setScanType("counter")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm transition-colors",
              scanType === "counter"
                ? "border-red-500 bg-red-500 text-white"
                : "hover:bg-muted"
            )}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Counter
          </button>
          <button
            onClick={handleScan}
            disabled={!topic.trim() || scan.isPending || authorLoading}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {scan.isPending ? "Scanning..." : "Scan"}
          </button>
        </div>
      </div>

      {/* ─── Loading State ──────────────────────────────────── */}
      {scan.isPending && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}

      {/* ─── Summary ────────────────────────────────────────── */}
      {scan.data && !scan.isPending && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">{scan.data.message}</p>
          {scan.data.summary && (
            <p className="mt-1 text-xs text-muted-foreground">
              {scan.data.summary}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Query: &quot;{scan.data.query_used}&quot;
          </p>
        </div>
      )}

      {/* ─── Results ────────────────────────────────────────── */}
      {scan.data && !scan.isPending && (
        <div className="space-y-3">
          {scan.data.evidence_items.map((item, idx) => {
            const typeConf = TYPE_CONFIG[item.evidence_type] || {
              label: item.evidence_type,
              color: "bg-gray-100 text-gray-700",
            };
            const isSaved = savedIds.has(idx);

            return (
              <div
                key={idx}
                className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          typeConf.color
                        )}
                      >
                        {typeConf.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {Math.round(item.relevance_score * 100)}% relevance
                      </span>
                    </div>
                    <h3 className="font-medium text-sm leading-tight">
                      {item.source_title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
                      {item.snippet}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Source
                    </a>
                    <button
                      onClick={() => handleSaveToBrain(item, idx)}
                      disabled={isSaved || commitKnowledge.isPending}
                      className={cn(
                        "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                        isSaved
                          ? "bg-green-100 text-green-700"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      <BookmarkPlus className="h-3 w-3" />
                      {isSaved ? "Saved" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Empty state ────────────────────────────────────── */}
      {!scan.data && !scan.isPending && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <Radar className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="font-medium">No scans yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Enter a topic or belief above and click Scan to find supporting
            evidence from across the web.
          </p>
        </div>
      )}

      {/* ─── Error state ────────────────────────────────────── */}
      {scan.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Scan failed: {scan.error?.message || "Unknown error"}
        </div>
      )}
    </div>
  );
}
