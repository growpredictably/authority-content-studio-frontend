"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FolderOpen,
  PenLine,
  Trash2,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import {
  useDrafts,
  useEmptyDraftsCount,
  useArchiveDraft,
  useDeleteDraft,
  useBulkDeleteDrafts,
  useDraftRetentionCleanup,
} from "@/lib/api/hooks/use-drafts";
import {
  DraftCard,
  getDraftTitle,
  getPhase,
  hasMeaningfulProgress,
  type DraftPhase,
} from "@/components/drafts/draft-card";
import type { DraftSession } from "@/lib/api/types";

// ─── Filter Helpers ──────────────────────────────────────────

type StageFilter = "" | "angles" | "refine" | "outline" | "writing";
type StrategyFilter = "" | "YouTube" | "Market" | "Starter";
type ContentTypeFilter = "" | "linkedin_post" | "linkedin_article" | "seo_article";
type DateRange = "" | "7" | "30" | "90";
type SortMode = "recent" | "oldest" | "progress";

function matchesStrategy(
  session: DraftSession,
  filter: StrategyFilter
): boolean {
  if (!filter) return true;
  const s = session.content_strategy || session.strategy || "";
  switch (filter) {
    case "YouTube":
      return s === "YouTube";
    case "Market":
      return s === "MarketAnalysis" || s === "market-analysis";
    case "Starter":
      return (
        s === "PostStarter" || s === "post-starter" || s === "linkedin_posts"
      );
    default:
      return true;
  }
}

// getDraftTitle is imported from draft-card.tsx

function phaseOrder(phase: DraftPhase): number {
  switch (phase) {
    case "writing":
      return 5;
    case "outline":
      return 4;
    case "refine":
      return 3;
    case "angles":
      return 2;
    default:
      return 1;
  }
}

const STAGE_FILTERS: { value: StageFilter; label: string }[] = [
  { value: "", label: "All Stages" },
  { value: "angles", label: "Angles" },
  { value: "refine", label: "Refine" },
  { value: "outline", label: "Outline" },
  { value: "writing", label: "Writing" },
];

const STRATEGY_FILTERS: { value: StrategyFilter; label: string }[] = [
  { value: "", label: "All Sources" },
  { value: "YouTube", label: "YouTube" },
  { value: "Market", label: "Market" },
  { value: "Starter", label: "Starter" },
];

const CONTENT_TYPE_FILTERS: { value: ContentTypeFilter; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "linkedin_post", label: "LinkedIn Posts" },
  { value: "linkedin_article", label: "LinkedIn Articles" },
  { value: "seo_article", label: "SEO Articles" },
];

const DATE_RANGE_FILTERS: { value: DateRange; label: string }[] = [
  { value: "", label: "All Time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "recent", label: "Newest First" },
  { value: "oldest", label: "Oldest" },
  { value: "progress", label: "Most Progress" },
];

// ─── Filter Pill ─────────────────────────────────────────────

function Pill<T extends string>({
  value,
  current,
  label,
  onChange,
}: {
  value: T;
  current: T;
  label: string;
  onChange: (v: T) => void;
}) {
  return (
    <button
      onClick={() => onChange(value)}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        current === value
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      {label}
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function DraftsPage() {
  const { author, isLoading: authorLoading } = useAuthor();
  const userId = author?.user_id;

  // Auto-cleanup based on admin retention policy
  useDraftRetentionCleanup(userId);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [includeAbandoned, setIncludeAbandoned] = useState(false);
  const [stageFilter, setStageFilter] = useState<StageFilter>("");
  const [strategyFilter, setStrategyFilter] = useState<StrategyFilter>("");
  const [contentTypeFilter, setContentTypeFilter] =
    useState<ContentTypeFilter>("");
  const [dateRange, setDateRange] = useState<DateRange>("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [cleanupOpen, setCleanupOpen] = useState(false);

  // Data
  const { data: allSessions = [], isLoading: sessionsLoading } =
    useDrafts(userId);
  const archiveDraft = useArchiveDraft();
  const deleteDraft = useDeleteDraft();
  const { data: emptyDraftCount = 0 } = useEmptyDraftsCount(userId);
  const bulkDelete = useBulkDeleteDrafts();

  const isLoading = authorLoading || sessionsLoading;

  // Client-side filtering
  const filteredSessions = useMemo(() => {
    let result = allSessions;

    // Include abandoned toggle (default OFF = hide sessions without progress)
    if (!includeAbandoned) {
      result = result.filter(hasMeaningfulProgress);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => getDraftTitle(s).toLowerCase().includes(q));
    }

    // Stage filter
    if (stageFilter) {
      result = result.filter((s) => getPhase(s) === stageFilter);
    }

    // Strategy filter
    if (strategyFilter) {
      result = result.filter((s) => matchesStrategy(s, strategyFilter));
    }

    // Content type filter
    if (contentTypeFilter) {
      result = result.filter(
        (s) => (s.content_type || "linkedin_post") === contentTypeFilter
      );
    }

    // Date range filter
    if (dateRange) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - Number(dateRange));
      result = result.filter(
        (s) => new Date(s.updated_at) >= cutoff
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortMode) {
        case "oldest":
          return (
            new Date(a.updated_at).getTime() -
            new Date(b.updated_at).getTime()
          );
        case "progress":
          return phaseOrder(getPhase(b)) - phaseOrder(getPhase(a));
        default:
          return (
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime()
          );
      }
    });

    return result;
  }, [
    allSessions,
    includeAbandoned,
    searchQuery,
    stageFilter,
    strategyFilter,
    contentTypeFilter,
    dateRange,
    sortMode,
  ]);

  // Draft count (meaningful progress sessions)
  const meaningfulCount = useMemo(
    () => allSessions.filter(hasMeaningfulProgress).length,
    [allSessions]
  );

  function handleArchive(sessionId: string) {
    archiveDraft.mutate(sessionId, {
      onSuccess: () => toast.success("Draft archived"),
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to archive"
        ),
    });
  }

  function handleDelete(sessionId: string) {
    deleteDraft.mutate(sessionId, {
      onSuccess: () => toast.success("Draft deleted"),
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to delete"
        ),
    });
  }

  function handleCleanup() {
    const emptyIds = allSessions
      .filter((s) => !hasMeaningfulProgress(s))
      .map((s) => s.id);

    if (emptyIds.length === 0) {
      setCleanupOpen(false);
      return;
    }

    bulkDelete.mutate(emptyIds, {
      onSuccess: () => {
        toast.success(`Cleaned up ${emptyIds.length} abandoned drafts`);
        setCleanupOpen(false);
      },
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to clean up"
        ),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Drafts</h1>
            <AuthorSelector />
          </div>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              {meaningfulCount} draft{meaningfulCount !== 1 ? "s" : ""} in
              progress
            </p>
          )}
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/content/angles">
            <PenLine className="h-3.5 w-3.5" />
            New Content
          </Link>
        </Button>
      </div>

      {/* Cleanup banner */}
      {emptyDraftCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-800 dark:bg-amber-950">
          <span className="text-sm text-amber-700 dark:text-amber-300">
            {emptyDraftCount} abandoned draft
            {emptyDraftCount > 1 ? "s" : ""} with no progress
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCleanupOpen(true)}
            className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clean up
          </Button>
        </div>
      )}

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search drafts by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Row 1: Content type pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">
            Type
          </span>
          {CONTENT_TYPE_FILTERS.map((f) => (
            <Pill
              key={f.value}
              value={f.value}
              current={contentTypeFilter}
              label={f.label}
              onChange={setContentTypeFilter}
            />
          ))}
        </div>

        {/* Row 2: Stage + Strategy + Date range */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">
            Stage
          </span>
          {STAGE_FILTERS.map((f) => (
            <Pill
              key={f.value}
              value={f.value}
              current={stageFilter}
              label={f.label}
              onChange={setStageFilter}
            />
          ))}

          <span className="text-muted-foreground text-[10px] mx-1">|</span>

          <span className="text-xs font-medium text-muted-foreground mr-1">
            Source
          </span>
          {STRATEGY_FILTERS.map((f) => (
            <Pill
              key={f.value}
              value={f.value}
              current={strategyFilter}
              label={f.label}
              onChange={setStrategyFilter}
            />
          ))}
        </div>

        {/* Row 3: Date range + Sort + Include abandoned */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">
            Date
          </span>
          {DATE_RANGE_FILTERS.map((f) => (
            <Pill
              key={f.value}
              value={f.value}
              current={dateRange}
              label={f.label}
              onChange={setDateRange}
            />
          ))}

          <span className="text-muted-foreground text-[10px] mx-1">|</span>

          <span className="text-xs font-medium text-muted-foreground mr-1">
            Sort
          </span>
          {SORT_OPTIONS.map((f) => (
            <Pill
              key={f.value}
              value={f.value}
              current={sortMode}
              label={f.label}
              onChange={setSortMode}
            />
          ))}

          <span className="text-muted-foreground text-[10px] mx-1">|</span>

          {/* Include abandoned toggle */}
          <button
            onClick={() => setIncludeAbandoned((v) => !v)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
              includeAbandoned
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Include abandoned
          </button>
        </div>
      </div>

      {/* Filtered count */}
      {!isLoading && filteredSessions.length !== meaningfulCount && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredSessions.length} of {allSessions.length} drafts
        </p>
      )}

      {/* Draft Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {allSessions.length === 0
              ? "No drafts yet. Generate content and save it here."
              : "No drafts match your current filters."}
          </p>
          {allSessions.length === 0 && (
            <Button asChild variant="outline" size="sm">
              <Link href="/content/angles">Create your first piece</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((session) => (
            <DraftCard
              key={session.id}
              session={session}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Cleanup Confirmation */}
      <AlertDialog open={cleanupOpen} onOpenChange={setCleanupOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Clean up {emptyDraftCount} abandoned draft
              {emptyDraftCount > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete drafts with no progress (no angles
              selected, no outline, no written content). Drafts with meaningful
              progress will be kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCleanup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDelete.isPending}
            >
              {bulkDelete.isPending && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Clean up
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
