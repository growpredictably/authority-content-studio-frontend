"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Headphones,
  Search,
  Clock,
  Eye,
  Trash2,
  Copy,
  Check,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Brain,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Sparkles,
  Pencil,
  Blocks,
} from "lucide-react";
import { useAuthor } from "@/hooks/use-author";
import {
  useFirefliesTranscriptions,
  useMeetingTypeCounts,
  useTrainingStatus,
  useUpdateMeetingType,
  useUpdateTranscription,
  useDeleteTranscriptions,
  useMarkAsTrained,
  type TranscriptionFilters,
} from "@/lib/api/hooks/use-transcriptions";
import {
  useExtractFramework,
  useEnrichFramework,
} from "@/lib/api/hooks/use-extract-framework";
import { useFrameworks } from "@/lib/api/hooks/use-frameworks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FirefliesTranscription } from "@/lib/api/types";

// ─── Helpers ────────────────────────────────────────────────

function wordCount(text: string | null): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

const PAGE_SIZES = [10, 25, 50, 100, 250, 500, 1000];
const MAX_TYPE_PILLS = 5;

// ─── Filter Pill ────────────────────────────────────────────

function Pill({
  label,
  count,
  isActive,
  onClick,
  icon: Icon,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  icon?: typeof Sparkles;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
        isActive
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-transparent text-muted-foreground border-border hover:bg-accent"
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px]",
          isActive ? "bg-primary-foreground/20" : "bg-muted"
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Sortable Column Header ─────────────────────────────────

function SortHeader({
  label,
  field,
  currentField,
  desc,
  onSort,
}: {
  label: string;
  field: string;
  currentField: string;
  desc: boolean;
  onSort: (field: string) => void;
}) {
  const active = currentField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-left hover:text-foreground transition-colors"
    >
      {label}
      {active ? (
        desc ? (
          <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUp className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

// ─── Inline Meeting Type Editor ─────────────────────────────

function MeetingTypeEditor({
  currentType,
  availableTypes,
  onSelect,
  isLoading,
}: {
  currentType: string | null;
  availableTypes: string[];
  onSelect: (type: string | null) => void;
  isLoading?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] font-normal w-fit"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
      </Badge>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="text-left">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-normal cursor-pointer hover:bg-accent transition-colors",
              !currentType && "text-muted-foreground italic"
            )}
          >
            {currentType || "Add type"}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        <div className="max-h-60 overflow-y-auto">
          {currentType && (
            <>
              <button
                onClick={() => {
                  onSelect(null);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs rounded hover:bg-accent transition-colors text-muted-foreground"
              >
                Clear type
              </button>
              <div className="border-b my-1" />
            </>
          )}
          {availableTypes.map((type) => (
            <button
              key={type}
              onClick={() => {
                onSelect(type);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs rounded hover:bg-accent transition-colors",
                type === currentType && "bg-accent font-medium"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function TranscriptionsPage() {
  const router = useRouter();
  const { author, isLoading: authorLoading } = useAuthor();

  // ── Filters & pagination ────────────────────────────────
  const [filters, setFilters] = useState<TranscriptionFilters>({
    search: "",
    meetingType: "All",
    trainingStatus: "all",
    sortField: "meeting_date",
    sortDesc: true,
    page: 1,
    pageSize: 25,
  });

  // ── Search input (separate from applied filter) ─────────
  const [searchInput, setSearchInput] = useState("");

  // ── Selection ───────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ── Preview, delete, train state ────────────────────────
  const [previewItem, setPreviewItem] =
    useState<FirefliesTranscription | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number[] | null>(null);
  const [trainTarget, setTrainTarget] =
    useState<FirefliesTranscription | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [transcriptCopied, setTranscriptCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    meeting_type: "",
    meeting_date: "",
    duration_minutes: "",
    organizer_email: "",
    transcript_summary: "",
    transcript: "",
    participants: "",
    fireflies_url: "",
  });
  const [frameworkTarget, setFrameworkTarget] =
    useState<FirefliesTranscription | null>(null);
  const [frameworkName, setFrameworkName] = useState("");
  const [useBatch, setUseBatch] = useState(false);
  const [frameworkMode, setFrameworkMode] = useState<"create" | "enrich">(
    "create"
  );
  const [enrichTargetId, setEnrichTargetId] = useState("");

  // ── Data hooks ──────────────────────────────────────────
  const { data: typeCounts, isLoading: typesLoading } = useMeetingTypeCounts(
    author?.user_id
  );
  const { data: trainedIds, isLoading: trainingLoading } = useTrainingStatus(
    author?.id
  );
  const { data: listData, isLoading: listLoading } =
    useFirefliesTranscriptions(author?.user_id, filters, trainedIds);

  // ── Mutations ─────────────────────────────────────────
  const updateType = useUpdateMeetingType();
  const deleteMutation = useDeleteTranscriptions();
  const markTrained = useMarkAsTrained();
  const updateTranscription = useUpdateTranscription();
  const extractFramework = useExtractFramework();
  const enrichFramework = useEnrichFramework();
  const { data: frameworksData } = useFrameworks(author?.id);
  const existingFrameworks = frameworksData?.frameworks || [];

  // ── Derived values ────────────────────────────────────
  const isLoading = authorLoading || typesLoading || trainingLoading;
  const items = listData?.transcriptions || [];
  const totalFiltered = listData?.total ?? 0;
  const totalAll = typeCounts?.total ?? 0;
  const untypedCount = typeCounts?.untypedCount ?? 0;
  const trainedCount = trainedIds?.size ?? 0;
  const notTrainedCount = totalAll - trainedCount;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / filters.pageSize));
  const anyMutating =
    markTrained.isPending ||
    updateType.isPending ||
    deleteMutation.isPending ||
    extractFramework.isPending ||
    enrichFramework.isPending;

  // Client-side sort for "words" column
  const sortedItems = useMemo(() => {
    if (filters.sortField !== "words") return items;
    return [...items].sort((a, b) => {
      const wcA = wordCount(a.transcript);
      const wcB = wordCount(b.transcript);
      return filters.sortDesc ? wcB - wcA : wcA - wcB;
    });
  }, [items, filters.sortField, filters.sortDesc]);

  // Meeting type pills with overflow
  const sortedTypes = useMemo(() => {
    if (!typeCounts?.counts) return [];
    return Object.entries(typeCounts.counts)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({ type, count }));
  }, [typeCounts]);

  const visibleTypes = sortedTypes.slice(0, MAX_TYPE_PILLS);
  const overflowTypes = sortedTypes.slice(MAX_TYPE_PILLS);

  const availableTypes = useMemo(
    () => sortedTypes.map((t) => t.type),
    [sortedTypes]
  );

  // ── Handlers ──────────────────────────────────────────

  function updateFilter(patch: Partial<TranscriptionFilters>) {
    setFilters((f) => ({ ...f, page: 1, ...patch }));
    setSelectedIds(new Set());
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFilter({ search: searchInput });
  }

  function handleMeetingTypeClick(type: string) {
    // Toggle: clicking active pill deselects to "All"
    if (filters.meetingType === type) {
      updateFilter({ meetingType: "All" });
    } else {
      updateFilter({ meetingType: type });
    }
  }

  function handleSort(field: string) {
    setFilters((f) => ({
      ...f,
      sortField: field,
      sortDesc: f.sortField === field ? !f.sortDesc : true,
      page: 1,
    }));
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  function handleCopyUrl(item: FirefliesTranscription) {
    if (item.fireflies_url) {
      navigator.clipboard.writeText(item.fireflies_url);
      setCopiedId(item.id);
      toast.success("Fireflies URL copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.error("No Fireflies URL available");
    }
  }

  function handleCopyTranscript(text: string) {
    navigator.clipboard.writeText(text);
    setTranscriptCopied(true);
    toast.success("Transcript copied");
    setTimeout(() => setTranscriptCopied(false), 2000);
  }

  function handleUpdateType(ids: number[], meetingType: string | null) {
    updateType.mutate(
      { ids, meetingType },
      {
        onSuccess: () =>
          toast.success(
            meetingType
              ? `Updated type to "${meetingType}"`
              : "Cleared meeting type"
          ),
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  }

  function handleDelete() {
    if (!deleteTarget?.length) return;
    const toDelete = [...deleteTarget];
    deleteMutation.mutate(toDelete, {
      onSuccess: () => {
        toast.success(
          `Deleted ${toDelete.length} transcription${toDelete.length > 1 ? "s" : ""}`
        );
        setDeleteTarget(null);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          toDelete.forEach((id) => next.delete(id));
          return next;
        });
      },
      onError: (e) => toast.error(`Delete failed: ${e.message}`),
    });
  }

  function handleMarkTrained(ids: number[]) {
    if (!author) return;
    markTrained.mutate(
      {
        transcriptionIds: ids,
        authorId: author.id,
        userId: author.user_id,
      },
      {
        onSuccess: () => {
          toast.success(`Marked ${ids.length} as trained`);
          setSelectedIds(new Set());
        },
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  }

  function handleTrainConfirm() {
    if (!trainTarget || !author) return;
    handleMarkTrained([trainTarget.id]);
    router.push(`/voice?transcript_id=${trainTarget.id}`);
    setTrainTarget(null);
  }

  function startEditing(item?: FirefliesTranscription) {
    const target = item || previewItem;
    if (!target) return;
    setEditForm({
      title: target.title || "",
      meeting_type: target.meeting_type || "",
      meeting_date: target.meeting_date
        ? target.meeting_date.split("T")[0]
        : "",
      duration_minutes:
        target.duration_minutes != null
          ? String(target.duration_minutes)
          : "",
      organizer_email: target.organizer_email || "",
      transcript_summary: target.transcript_summary || "",
      transcript: target.transcript || "",
      participants: target.participants?.join(", ") || "",
      fireflies_url: target.fireflies_url || "",
    });
    if (item) setPreviewItem(item);
    setIsEditing(true);
  }

  function handleSaveEdit() {
    if (!previewItem) return;
    const updates: Record<string, unknown> = {
      title: editForm.title || previewItem.title,
      meeting_type: editForm.meeting_type || null,
      meeting_date: editForm.meeting_date || null,
      duration_minutes: editForm.duration_minutes
        ? Number(editForm.duration_minutes)
        : null,
      organizer_email: editForm.organizer_email || null,
      transcript_summary: editForm.transcript_summary || null,
      transcript: editForm.transcript || null,
      participants: editForm.participants
        ? editForm.participants
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean)
        : null,
      fireflies_url: editForm.fireflies_url || null,
    };

    updateTranscription.mutate(
      { id: previewItem.id, updates },
      {
        onSuccess: () => {
          toast.success("Transcription updated");
          setIsEditing(false);
          setPreviewItem(null);
        },
        onError: (e) => toast.error(`Update failed: ${e.message}`),
      }
    );
  }

  function handleFrameworkClick(item: FirefliesTranscription) {
    setFrameworkTarget(item);
    setFrameworkName("");
    setUseBatch(false);
    setFrameworkMode("create");
    setEnrichTargetId("");
  }

  function handleExtractConfirm() {
    if (!frameworkTarget || !author) return;

    if (frameworkMode === "enrich") {
      if (!enrichTargetId) return;
      enrichFramework.mutate(
        {
          frameworkId: enrichTargetId,
          transcriptionId: frameworkTarget.id,
          authorId: author.id,
          useBatch,
        },
        {
          onSuccess: (result) => {
            setFrameworkTarget(null);
            if ("batch" in result && result.batch) {
              toast.info(
                "Framework enrichment submitted. Results will be ready within 24 hours."
              );
            } else {
              toast.success("Framework enriched successfully!", {
                action: {
                  label: "View Framework",
                  onClick: () => router.push("/authority/frameworks"),
                },
              });
            }
          },
          onError: (e) => toast.error(`Enrichment failed: ${e.message}`),
        }
      );
    } else {
      extractFramework.mutate(
        {
          transcriptionId: frameworkTarget.id,
          authorId: author.id,
          frameworkName: frameworkName.trim() || undefined,
          useBatch,
        },
        {
          onSuccess: (result) => {
            setFrameworkTarget(null);
            if ("batch" in result && result.batch) {
              toast.info(
                "Framework extraction submitted. Results will be ready within 24 hours."
              );
            } else {
              toast.success("Framework extracted successfully!", {
                action: {
                  label: "View Framework",
                  onClick: () => router.push("/authority/frameworks"),
                },
              });
            }
          },
          onError: (e) => toast.error(`Extraction failed: ${e.message}`),
        }
      );
    }
  }

  // Header checkbox state
  const headerChecked =
    items.length > 0 && selectedIds.size === items.length
      ? true
      : selectedIds.size > 0
        ? ("indeterminate" as const)
        : false;

  // ── Render ────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Headphones className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Fireflies Transcriptions</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage meeting transcripts from Fireflies.ai
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : totalAll === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <Headphones className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="font-medium">No transcriptions yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Connect Fireflies.ai to automatically import your meeting
            transcripts.
          </p>
        </div>
      ) : (
        <>
          {/* Category Pills (with overflow) */}
          <div className="flex flex-wrap items-center gap-2">
            <Pill
              label="All"
              count={totalAll}
              isActive={filters.meetingType === "All"}
              onClick={() => handleMeetingTypeClick("All")}
            />
            {visibleTypes.map(({ type, count }) => (
              <Pill
                key={type}
                label={type}
                count={count}
                isActive={filters.meetingType === type}
                onClick={() => handleMeetingTypeClick(type)}
              />
            ))}
            {untypedCount > 0 && (
              <Pill
                label="Untyped"
                count={untypedCount}
                isActive={filters.meetingType === "Untyped"}
                onClick={() => handleMeetingTypeClick("Untyped")}
              />
            )}
            {overflowTypes.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border hover:bg-accent transition-colors">
                    +{overflowTypes.length} more
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="start">
                  <div className="max-h-60 overflow-y-auto">
                    {overflowTypes.map(({ type, count }) => (
                      <button
                        key={type}
                        onClick={() => handleMeetingTypeClick(type)}
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-xs rounded hover:bg-accent transition-colors flex items-center justify-between",
                          filters.meetingType === type &&
                            "bg-accent font-medium"
                        )}
                      >
                        <span>{type}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Training Filter + Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Training:
              </span>
              <Pill
                label="All"
                count={totalAll}
                isActive={filters.trainingStatus === "all"}
                onClick={() => updateFilter({ trainingStatus: "all" })}
              />
              <Pill
                label="Trained"
                count={trainedCount}
                isActive={filters.trainingStatus === "trained"}
                onClick={() => updateFilter({ trainingStatus: "trained" })}
                icon={Sparkles}
              />
              <Pill
                label="Not Trained"
                count={notTrainedCount}
                isActive={filters.trainingStatus === "not_trained"}
                onClick={() => updateFilter({ trainingStatus: "not_trained" })}
              />
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="relative flex-1 max-w-sm ml-auto flex items-center gap-1"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transcriptions..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="outline" size="icon" className="h-9 w-9 shrink-0">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Bulk Actions Bar (sticky) */}
          {selectedIds.size > 0 && (
            <div className="sticky top-0 z-10 flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2 backdrop-blur-sm">
              <span className="text-sm font-medium">
                {selectedIds.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkTrained([...selectedIds])}
                disabled={anyMutating}
              >
                {markTrained.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                Mark Trained
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" disabled={anyMutating}>
                    Set Type
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="start">
                  <div className="max-h-60 overflow-y-auto">
                    <button
                      onClick={() =>
                        handleUpdateType([...selectedIds], null)
                      }
                      className="w-full text-left px-3 py-1.5 text-xs rounded hover:bg-accent transition-colors text-muted-foreground"
                    >
                      Clear type
                    </button>
                    <div className="border-b my-1" />
                    {availableTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() =>
                          handleUpdateType([...selectedIds], type)
                        }
                        className="w-full text-left px-3 py-1.5 text-xs rounded hover:bg-accent transition-colors"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => setDeleteTarget([...selectedIds])}
                disabled={anyMutating}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border bg-card overflow-x-auto">
            <div className="px-4 py-3 border-b">
              <h2 className="text-sm font-semibold">Your Transcriptions</h2>
              <p className="text-xs text-muted-foreground">
                {totalFiltered} transcription{totalFiltered !== 1 ? "s" : ""}{" "}
                found
              </p>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[40px_1fr_120px_90px_140px_80px_180px] gap-2 px-4 py-2 border-b text-[11px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[800px]">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={headerChecked}
                  onCheckedChange={toggleSelectAll}
                />
              </div>
              <SortHeader
                label="Title"
                field="title"
                currentField={filters.sortField}
                desc={filters.sortDesc}
                onSort={handleSort}
              />
              <SortHeader
                label="Meeting Date"
                field="meeting_date"
                currentField={filters.sortField}
                desc={filters.sortDesc}
                onSort={handleSort}
              />
              <SortHeader
                label="Duration"
                field="duration_minutes"
                currentField={filters.sortField}
                desc={filters.sortDesc}
                onSort={handleSort}
              />
              <SortHeader
                label="Type"
                field="meeting_type"
                currentField={filters.sortField}
                desc={filters.sortDesc}
                onSort={handleSort}
              />
              <SortHeader
                label="Words"
                field="words"
                currentField={filters.sortField}
                desc={filters.sortDesc}
                onSort={handleSort}
              />
              <span className="text-right">Actions</span>
            </div>

            {/* Table Body */}
            {listLoading ? (
              <div className="space-y-2 p-4 min-w-[800px]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : sortedItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No transcriptions match your filters.
              </div>
            ) : (
              <div className="divide-y min-w-[800px]">
                {sortedItems.map((item) => {
                  const isTrained = trainedIds?.has(item.id) ?? false;
                  const wc = wordCount(item.transcript);
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "grid grid-cols-[40px_1fr_120px_90px_140px_80px_180px] gap-2 px-4 py-3 items-center hover:bg-accent/50 transition-colors",
                        selectedIds.has(item.id) && "bg-muted/50"
                      )}
                    >
                      {/* Checkbox */}
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={() => toggleSelect(item.id)}
                        />
                      </div>

                      {/* Title + trained badge */}
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {item.title}
                        </span>
                        {isTrained && (
                          <Badge className="text-[9px] shrink-0 bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                            Trained
                          </Badge>
                        )}
                      </div>

                      {/* Meeting Date */}
                      <span className="text-xs text-muted-foreground">
                        {item.meeting_date
                          ? new Date(item.meeting_date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "-"}
                      </span>

                      {/* Duration */}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {item.duration_minutes != null ? (
                          <>
                            <Clock className="h-3 w-3" />
                            {item.duration_minutes} min
                          </>
                        ) : (
                          "-"
                        )}
                      </span>

                      {/* Type (inline editable) */}
                      <MeetingTypeEditor
                        currentType={item.meeting_type}
                        availableTypes={availableTypes}
                        onSelect={(type) => handleUpdateType([item.id], type)}
                        isLoading={updateType.isPending}
                      />

                      {/* Words */}
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-medium w-fit"
                      >
                        {wc.toLocaleString()}
                      </Badge>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="View transcript"
                          onClick={() => setPreviewItem(item)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Edit transcript"
                          onClick={() => startEditing(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Train voice"
                          onClick={() => setTrainTarget(item)}
                        >
                          <Brain className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Fireflies → Framework"
                          onClick={() => handleFrameworkClick(item)}
                        >
                          <Blocks className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title={item.fireflies_url ? "Copy Fireflies URL" : "No Fireflies URL"}
                          onClick={() => handleCopyUrl(item)}
                          disabled={!item.fireflies_url}
                        >
                          {copiedId === item.id ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          title="Delete"
                          onClick={() => setDeleteTarget([item.id])}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between border-t px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Rows per page</span>
                <Select
                  value={String(filters.pageSize)}
                  onValueChange={(v) =>
                    updateFilter({ pageSize: Number(v) })
                  }
                >
                  <SelectTrigger className="h-7 w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Page {filters.page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={filters.page <= 1}
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: f.page - 1 }))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={filters.page >= totalPages}
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: f.page + 1 }))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Preview Sheet */}
      <Sheet
        open={!!previewItem}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewItem(null);
            setIsEditing(false);
          }
        }}
      >
        <SheetContent className="sm:max-w-2xl flex flex-col">
          {previewItem && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle>
                    {isEditing ? "Edit Transcription" : previewItem.title}
                  </SheetTitle>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing()}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  )}
                </div>
                {!isEditing && (
                  <SheetDescription className="flex flex-wrap items-center gap-2">
                    {previewItem.meeting_type && (
                      <Badge variant="secondary">
                        {previewItem.meeting_type}
                      </Badge>
                    )}
                    {previewItem.meeting_date &&
                      new Date(
                        previewItem.meeting_date
                      ).toLocaleDateString()}
                    {previewItem.duration_minutes != null &&
                      ` · ${previewItem.duration_minutes} min`}
                    {` · ${wordCount(previewItem.transcript).toLocaleString()} words`}
                    {previewItem.participants &&
                      previewItem.participants.length > 0 &&
                      ` · ${previewItem.participants.length} participants`}
                  </SheetDescription>
                )}
              </SheetHeader>

              {isEditing ? (
                /* ── Edit Mode ── */
                <>
                  <div className="flex-1 overflow-y-auto space-y-4 mt-6">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="edit-title">Title</Label>
                        <Input
                          id="edit-title"
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              title: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="edit-type">Meeting Type</Label>
                          <Select
                            value={editForm.meeting_type || "__none__"}
                            onValueChange={(v) =>
                              setEditForm((f) => ({
                                ...f,
                                meeting_type: v === "__none__" ? "" : v,
                              }))
                            }
                          >
                            <SelectTrigger id="edit-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">
                                No type
                              </SelectItem>
                              {availableTypes.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="edit-date">Meeting Date</Label>
                          <Input
                            id="edit-date"
                            type="date"
                            value={editForm.meeting_date}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                meeting_date: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="edit-duration">
                            Duration (minutes)
                          </Label>
                          <Input
                            id="edit-duration"
                            type="number"
                            value={editForm.duration_minutes}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                duration_minutes: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-email">
                            Organizer Email
                          </Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={editForm.organizer_email}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                organizer_email: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="edit-participants">
                          Participants (comma-separated)
                        </Label>
                        <Input
                          id="edit-participants"
                          value={editForm.participants}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              participants: e.target.value,
                            }))
                          }
                          placeholder="john@example.com, jane@example.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-url">Fireflies URL</Label>
                        <Input
                          id="edit-url"
                          type="url"
                          value={editForm.fireflies_url}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              fireflies_url: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-summary">
                          Transcript Summary
                        </Label>
                        <Textarea
                          id="edit-summary"
                          value={editForm.transcript_summary}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              transcript_summary: e.target.value,
                            }))
                          }
                          rows={4}
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-transcript">
                          Full Transcript
                        </Label>
                        <Textarea
                          id="edit-transcript"
                          value={editForm.transcript}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              transcript: e.target.value,
                            }))
                          }
                          rows={12}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Edit Footer */}
                  <div className="border-t pt-4 mt-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      disabled={updateTranscription.isPending}
                    >
                      {updateTranscription.isPending && (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </>
              ) : (
                /* ── View Mode ── */
                <>
                  <div className="flex-1 overflow-y-auto space-y-4 mt-6">
                    {/* Participants (max 5 + overflow) */}
                    {previewItem.participants &&
                      previewItem.participants.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            Participants
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {previewItem.participants
                              .slice(0, 5)
                              .map((p, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {p}
                                </Badge>
                              ))}
                            {previewItem.participants.length > 5 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-muted-foreground"
                              >
                                +{previewItem.participants.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Fireflies URL */}
                    {previewItem.fireflies_url && (
                      <a
                        href={previewItem.fireflies_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View on Fireflies
                      </a>
                    )}

                    {/* Summary (with fallback to transcript_summary) */}
                    {(previewItem.summary_data?.overview ||
                      previewItem.transcript_summary) && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Summary
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {previewItem.summary_data?.overview ||
                            previewItem.transcript_summary}
                        </p>
                      </div>
                    )}

                    {/* Action Items */}
                    {previewItem.summary_data?.action_items &&
                      previewItem.summary_data.action_items.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            Action Items
                          </h4>
                          <ul className="list-disc list-inside space-y-0.5 text-sm">
                            {previewItem.summary_data.action_items.map(
                              (actionItem, i) => (
                                <li key={i}>{actionItem}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    {/* Topics */}
                    {previewItem.summary_data?.topics_discussed &&
                      previewItem.summary_data.topics_discussed.length >
                        0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            Topics Discussed
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {previewItem.summary_data.topics_discussed.map(
                              (t, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {t}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Keywords */}
                    {previewItem.summary_data?.keywords &&
                      previewItem.summary_data.keywords.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            Keywords
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {previewItem.summary_data.keywords.map(
                              (k, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {k}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Full Transcript (with copy button in header) */}
                    {previewItem.transcript && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Full Transcript
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() =>
                              handleCopyTranscript(
                                previewItem.transcript!
                              )
                            }
                          >
                            {transcriptCopied ? (
                              <Check className="h-3 w-3 mr-1 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3 mr-1" />
                            )}
                            {transcriptCopied ? "Copied" : "Copy"}
                          </Button>
                        </div>
                        <div className="rounded-lg border p-3 max-h-[400px] overflow-y-auto">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {previewItem.transcript}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* View Footer */}
                  <div className="border-t pt-4 mt-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPreviewItem(null)}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        setTrainTarget(previewItem);
                        setPreviewItem(null);
                      }}
                      disabled={!previewItem.transcript}
                    >
                      <Brain className="h-3.5 w-3.5 mr-1.5" />
                      Train Voice with This
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Transcription
              {deleteTarget && deleteTarget.length > 1 ? "s" : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteTarget?.length ?? 0}{" "}
              transcription
              {deleteTarget && deleteTarget.length > 1 ? "s" : ""}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Train Voice Confirmation */}
      <AlertDialog
        open={!!trainTarget}
        onOpenChange={(open) => !open && setTrainTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Train Voice with this transcript?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will mark &quot;{trainTarget?.title}&quot; as trained and
              open the Voice Studio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleTrainConfirm();
              }}
            >
              <Brain className="h-4 w-4 mr-1.5" />
              Train Voice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Extract / Enrich Framework Confirmation */}
      <AlertDialog
        open={!!frameworkTarget}
        onOpenChange={(open) => {
          const busy =
            extractFramework.isPending || enrichFramework.isPending;
          if (!open && !busy) setFrameworkTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {frameworkMode === "enrich"
                ? "Enrich Framework"
                : "Extract Framework"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {frameworkMode === "enrich"
                ? `This will analyze the transcript "${frameworkTarget?.title}" and add new insights to an existing framework.`
                : `This will analyze the transcript "${frameworkTarget?.title}" and extract a structured marketing framework.`}{" "}
              This uses AI and may take 30-60 seconds.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Mode Toggle */}
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => setFrameworkMode("create")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                frameworkMode === "create"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              disabled={
                extractFramework.isPending || enrichFramework.isPending
              }
            >
              Create New
            </button>
            <button
              onClick={() => setFrameworkMode("enrich")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                frameworkMode === "enrich"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                existingFrameworks.length === 0 &&
                  "opacity-50 cursor-not-allowed"
              )}
              disabled={
                existingFrameworks.length === 0 ||
                extractFramework.isPending ||
                enrichFramework.isPending
              }
            >
              Enrich Existing
            </button>
          </div>

          <div className="space-y-3 py-2">
            {frameworkMode === "create" ? (
              <div>
                <Label htmlFor="framework-name">
                  Framework Name (optional)
                </Label>
                <Input
                  id="framework-name"
                  placeholder="Leave blank to auto-generate from transcript"
                  value={frameworkName}
                  onChange={(e) => setFrameworkName(e.target.value)}
                  disabled={extractFramework.isPending}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="enrich-target">Target Framework</Label>
                <Select
                  value={enrichTargetId}
                  onValueChange={setEnrichTargetId}
                  disabled={enrichFramework.isPending}
                >
                  <SelectTrigger id="enrich-target">
                    <SelectValue placeholder="Select a framework to enrich" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingFrameworks.map((fw) => (
                      <SelectItem key={fw.id} value={fw.id}>
                        {fw.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="use-batch"
                checked={useBatch}
                onCheckedChange={(v) => setUseBatch(v === true)}
                disabled={
                  extractFramework.isPending || enrichFramework.isPending
                }
              />
              <Label
                htmlFor="use-batch"
                className="text-sm font-normal cursor-pointer"
              >
                Use batch processing (50% cheaper, results in ~24 hours)
              </Label>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={
                extractFramework.isPending || enrichFramework.isPending
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleExtractConfirm();
              }}
              disabled={
                extractFramework.isPending ||
                enrichFramework.isPending ||
                (frameworkMode === "enrich" && !enrichTargetId)
              }
            >
              {(extractFramework.isPending ||
                enrichFramework.isPending) && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              <Blocks className="h-4 w-4 mr-1.5" />
              {frameworkMode === "enrich"
                ? "Enrich Framework"
                : "Extract Framework"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
