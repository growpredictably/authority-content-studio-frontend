"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Radar,
  Search,
  ExternalLink,
  BookmarkPlus,
  Zap,
  ShieldAlert,
  Tag,
  ChevronDown,
} from "lucide-react";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import {
  usePacketThemes,
  useThemeEvidence,
  useRadarScan,
} from "@/lib/api/hooks/use-evidence";
import { useCommitKnowledge } from "@/lib/api/hooks/use-brain-builder";
import { cn } from "@/lib/utils";
import type { RadarEvidenceItem, RadarScanResponse } from "@/lib/api/types";

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  statistic: { label: "Statistic", color: "bg-blue-100 text-blue-700" },
  study: { label: "Study", color: "bg-purple-100 text-purple-700" },
  expert_opinion: { label: "Expert Opinion", color: "bg-amber-100 text-amber-700" },
  counter_argument: { label: "Counter", color: "bg-red-100 text-red-700" },
};

export default function EvidenceFeedPage() {
  const { author, isLoading: authorLoading } = useAuthor();
  const themes = usePacketThemes(author?.id);
  const manualScan = useRadarScan();
  const commitKnowledge = useCommitKnowledge();

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [manualTopic, setManualTopic] = useState("");
  const [scanType, setScanType] = useState<"evidence" | "counter">("evidence");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  const packetThemes = themes.data ?? [];

  // Sort: calibrating first, then ready, then draft
  const STAGE_ORDER: Record<string, number> = { calibrating: 0, ready: 1, draft: 2 };
  const sortedThemes = useMemo(
    () =>
      [...packetThemes].sort(
        (a, b) => (STAGE_ORDER[a.stage] ?? 3) - (STAGE_ORDER[b.stage] ?? 3)
      ),
    [packetThemes]
  );

  const MAX_PILLS = 5;

  // If selected theme is in overflow, swap it into the visible set
  const visibleThemes = useMemo(() => {
    const top = sortedThemes.slice(0, MAX_PILLS);
    const overflow = sortedThemes.slice(MAX_PILLS);
    if (selectedTheme && overflow.some((t) => t.theme === selectedTheme)) {
      const selectedItem = overflow.find((t) => t.theme === selectedTheme)!;
      return [...top.slice(0, MAX_PILLS - 1), selectedItem];
    }
    return top;
  }, [sortedThemes, selectedTheme]);

  const overflowThemes = useMemo(
    () => sortedThemes.filter((t) => !visibleThemes.includes(t)),
    [sortedThemes, visibleThemes]
  );

  // Auto-select first "calibrating" theme, or fall back to first theme
  useEffect(() => {
    if (selectedTheme || sortedThemes.length === 0) return;
    setSelectedTheme(sortedThemes[0].theme);
  }, [sortedThemes, selectedTheme]);

  // Close overflow dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    }
    if (overflowOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [overflowOpen]);

  // Steps 2-4: Auto-load evidence for the selected theme (cache-first)
  const themeEvidence = useThemeEvidence(author?.id, selectedTheme);

  // Decide which results to display: manual scan takes priority when active
  const activeResult: RadarScanResponse | undefined =
    manualScan.data ?? themeEvidence.data ?? undefined;
  const isLoading =
    themeEvidence.isLoading || themeEvidence.isFetching || manualScan.isPending;

  function handleManualScan() {
    if (!author || !manualTopic.trim()) return;
    manualScan.mutate({
      author_id: author.id,
      belief_text: manualTopic.trim(),
      scan_type: scanType,
      max_results: 8,
    });
  }

  function handleSaveToBrain(item: RadarEvidenceItem, idx: number) {
    if (!author || !activeResult) return;
    const candidate = activeResult.curate_candidates?.[idx];
    const key = `${item.source_url}-${idx}`;

    commitKnowledge.mutate(
      {
        author_id: author.id,
        items: [
          {
            title: item.source_title,
            summary: item.snippet,
            key_quotes: [],
            endorsement_level:
              scanType === "counter" ? "anti_model" : "reference",
            strategic_tags: [
              item.evidence_type,
              scanType,
              ...(candidate && "suggested_tags" in candidate
                ? (candidate.suggested_tags as string[])
                : []),
            ],
            source_url: item.source_url,
            source_title: item.source_title,
            source_type: "article",
          },
        ],
      },
      {
        onSuccess: () => {
          setSavedIds((prev) => new Set(prev).add(key));
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Radar className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Evidence Feed</h1>
        <AuthorSelector />
      </div>

      <p className="text-sm text-muted-foreground max-w-2xl">
        Search the web for statistics, studies, and expert opinions that support
        (or challenge) your authority positions. Save the best finds directly to
        your Brain.
      </p>

      {/* ─── Theme Chips (max 5) + Overflow ────────────────── */}
      {sortedThemes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Tag className="h-3.5 w-3.5" />
            Your Belief Themes
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {visibleThemes.map(({ theme, stage }) => (
              <button
                key={theme}
                onClick={() => {
                  setSelectedTheme(theme);
                  manualScan.reset();
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  selectedTheme === theme
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                  stage === "ready" && selectedTheme !== theme && "border-green-300",
                  stage === "calibrating" &&
                    selectedTheme !== theme &&
                    "border-amber-300"
                )}
              >
                {theme}
                {stage === "calibrating" && (
                  <span className="ml-1 text-[10px] opacity-70">(calibrating)</span>
                )}
              </button>
            ))}

            {overflowThemes.length > 0 && (
              <div className="relative" ref={overflowRef}>
                <button
                  onClick={() => setOverflowOpen((o) => !o)}
                  className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  +{overflowThemes.length} more
                  <ChevronDown className={cn("h-3 w-3 transition-transform", overflowOpen && "rotate-180")} />
                </button>

                {overflowOpen && (
                  <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border bg-popover p-1 shadow-md">
                    {overflowThemes.map(({ theme, stage }) => (
                      <button
                        key={theme}
                        onClick={() => {
                          setSelectedTheme(theme);
                          manualScan.reset();
                          setOverflowOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs transition-colors",
                          selectedTheme === theme
                            ? "bg-primary/10 font-medium text-primary"
                            : "hover:bg-muted"
                        )}
                      >
                        <span className="truncate">{theme}</span>
                        {stage === "calibrating" && (
                          <span className="ml-2 shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                            calibrating
                          </span>
                        )}
                        {stage === "ready" && (
                          <span className="ml-2 shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">
                            ready
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Loading themes ──────────────────────────────────── */}
      {themes.isLoading && (
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-28 rounded-full" />
          ))}
        </div>
      )}

      {/* ─── Manual Search Bar ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Or type a custom topic to search for evidence..."
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={manualTopic}
            onChange={(e) => setManualTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualScan()}
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
            onClick={handleManualScan}
            disabled={!manualTopic.trim() || manualScan.isPending || authorLoading}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {manualScan.isPending ? "Scanning..." : "Scan"}
          </button>
        </div>
      </div>

      {/* ─── Loading State ──────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}

      {/* ─── Summary ────────────────────────────────────────── */}
      {activeResult && !isLoading && (activeResult.message || activeResult.summary) && (
        <div className="rounded-xl border bg-card p-4">
          {activeResult.message && (
            <p className="text-sm font-medium">{activeResult.message}</p>
          )}
          {activeResult.summary && (
            <p className="mt-1 text-xs text-muted-foreground">
              {activeResult.summary}
            </p>
          )}
          {activeResult.query_used && (
            <p className="mt-1 text-xs text-muted-foreground">
              Query: &quot;{activeResult.query_used}&quot;
            </p>
          )}
        </div>
      )}

      {/* ─── Results ────────────────────────────────────────── */}
      {activeResult && activeResult.evidence_items?.length > 0 && !isLoading && (
        <div className="space-y-3">
          {activeResult.evidence_items!.map((item, idx) => {
            const typeConf = TYPE_CONFIG[item.evidence_type] || {
              label: item.evidence_type,
              color: "bg-gray-100 text-gray-700",
            };
            const key = `${item.source_url}-${idx}`;
            const isSaved = savedIds.has(key);

            return (
              <div
                key={key}
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
      {!activeResult && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <Radar className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="font-medium">No scans yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {packetThemes.length === 0
              ? "Enter a topic or belief above and click Scan to find supporting evidence from across the web."
              : "Select a belief theme above or type a custom topic to scan for evidence."}
          </p>
        </div>
      )}

      {/* ─── Error states ───────────────────────────────────── */}
      {manualScan.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Scan failed: {manualScan.error?.message || "Unknown error"}
        </div>
      )}
      {themeEvidence.isError && !manualScan.data && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load evidence for &quot;{selectedTheme}&quot;:{" "}
          {themeEvidence.error?.message || "Unknown error"}
        </div>
      )}
    </div>
  );
}
