"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Newspaper,
  Search,
  PenTool,
  Youtube,
  TrendingUp,
  Sparkles,
  LayoutGrid,
  LayoutList,
  Copy,
  Trash2,
  MoreVertical,
  Loader2,
  FolderKanban,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthor } from "@/hooks/use-author";
import {
  useAllContent,
  useDeleteGeneratedPost,
  useBulkDeleteGeneratedPosts,
} from "@/lib/api/hooks/use-all-content";
import type { GeneratedPost } from "@/lib/api/types";

// ─── Config ──────────────────────────────────────────────────

const CONTENT_TYPE_CONFIG: Record<
  string,
  { icon: typeof FileText; color: string; label: string }
> = {
  linkedin_post: {
    icon: MessageSquare,
    color: "border-primary/30 text-primary bg-primary/10",
    label: "LinkedIn Post",
  },
  linkedin_article: {
    icon: FileText,
    color:
      "border-blue-500/30 text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
    label: "LinkedIn Article",
  },
  seo_article: {
    icon: Search,
    color:
      "border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950",
    label: "SEO Article",
  },
};

const STRATEGY_ICONS: Record<string, typeof Youtube> = {
  YouTube: Youtube,
  PostStarter: MessageSquare,
  MarketAnalysis: TrendingUp,
};

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "linkedin_post", label: "LinkedIn Posts" },
  { value: "linkedin_article", label: "LinkedIn Articles" },
  { value: "seo_article", label: "SEO Articles" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────

function getContentType(post: GeneratedPost): string {
  return post.content_sessions?.content_type || "linkedin_post";
}

function getStrategy(post: GeneratedPost): string | undefined {
  return post.content_sessions?.content_strategy;
}

// ─── Badges ──────────────────────────────────────────────────

function ContentTypeBadge({ contentType }: { contentType: string }) {
  const config =
    CONTENT_TYPE_CONFIG[contentType] ?? CONTENT_TYPE_CONFIG.linkedin_post;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        config.color
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function StrategyBadge({ strategy }: { strategy?: string }) {
  if (!strategy) return null;
  const Icon = STRATEGY_ICONS[strategy];
  if (!Icon) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <Icon className="h-3 w-3" />
      {strategy}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
        status === "published"
          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
      )}
    >
      {status === "published" ? "Published" : "Draft"}
    </span>
  );
}

// ─── Content Card ────────────────────────────────────────────

function ContentCard({
  post,
  selected,
  onSelect,
  onCopy,
  onDelete,
}: {
  post: GeneratedPost;
  selected: boolean;
  onSelect: (id: string) => void;
  onCopy: (body: string) => void;
  onDelete: (id: string) => void;
}) {
  const contentType = getContentType(post);
  const strategy = getStrategy(post);
  const title =
    post.post_title ||
    post.post_body.slice(0, 50).replace(/\n/g, " ") + "...";
  const wordCount = post.post_body.split(/\s+/).length;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 hover:shadow-md transition-all group",
        selected && "border-primary bg-primary/5 ring-1 ring-primary"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onSelect(post.id)}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <ContentTypeBadge contentType={contentType} />
            <StrategyBadge strategy={strategy} />
            <StatusBadge status={post.status} />
          </div>
          <h3 className="font-medium text-sm leading-tight line-clamp-2">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {post.post_body.slice(0, 120)}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(post.updated_at), {
                addSuffix: true,
              })}
            </span>
            <span>{wordCount.toLocaleString()} words</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onCopy(post.post_body)}>
              <Copy className="h-3.5 w-3.5 mr-2" />
              Copy
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(post.id)}
              className="text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function AllContentPage() {
  const { author, isLoading: authorLoading } = useAuthor();

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Read view mode from localStorage after mount
  useEffect(() => {
    const stored = localStorage.getItem("myPostsViewMode");
    if (stored === "list" || stored === "grid") setViewMode(stored);
  }, []);

  const handleViewChange = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("myPostsViewMode", mode);
  }, []);

  // Data
  const { data: posts = [], isLoading: postsLoading } = useAllContent(
    author?.user_id
  );
  const deleteMutation = useDeleteGeneratedPost();
  const bulkDeleteMutation = useBulkDeleteGeneratedPosts();

  const isLoading = authorLoading || postsLoading;

  // Client-side filtering
  const filtered = posts
    .filter((p) => {
      if (typeFilter && getContentType(p) !== typeFilter) return false;
      if (
        debouncedSearch &&
        !(p.post_title || "")
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortAsc ? da - db : db - da;
    });

  // Type counts from full (unfiltered-by-type) list
  const typeCounts = posts.reduce(
    (acc, p) => {
      const ct = getContentType(p);
      acc[ct] = (acc[ct] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Selection
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setSelectedIds(
      selectedIds.size === filtered.length
        ? new Set()
        : new Set(filtered.map((p) => p.id))
    );

  const handleCopy = async (body: string) => {
    await navigator.clipboard.writeText(body);
    toast.success("Copied to clipboard");
  };

  const handleCopyAll = async () => {
    const bodies = filtered
      .filter((p) => selectedIds.has(p.id))
      .map((p) => p.post_body);
    await navigator.clipboard.writeText(bodies.join("\n\n---\n\n"));
    toast.success(`Copied ${bodies.length} posts to clipboard`);
  };

  const handleDeleteSingle = (postId: string) => {
    deleteMutation.mutate(postId, {
      onSuccess: () => {
        toast.success("Content deleted");
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Failed to delete"),
    });
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate([...selectedIds], {
      onSuccess: () => {
        toast.success(`Deleted ${selectedIds.size} posts`);
        setSelectedIds(new Set());
        setDeleteConfirmOpen(false);
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Failed to delete"),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-6 w-6" />
          <h1 className="text-2xl font-bold">All Content</h1>
          {posts.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({posts.length})
            </span>
          )}
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/content/angles">
            <PenTool className="h-3.5 w-3.5" />
            New Content
          </Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type pills */}
        <div className="flex gap-1.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setTypeFilter(f.value);
                setSelectedIds(new Set());
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                typeFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f.label}
              {f.value && typeCounts[f.value]
                ? ` (${typeCounts[f.value]})`
                : ""}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* Sort */}
        <button
          onClick={() => setSortAsc((v) => !v)}
          className="rounded-full px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          {sortAsc ? "Oldest First" : "Newest First"}
        </button>

        {/* View toggle */}
        <div className="flex rounded-md border">
          <button
            onClick={() => handleViewChange("grid")}
            className={cn(
              "p-1.5 rounded-l-md transition-colors",
              viewMode === "grid"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleViewChange("list")}
            className={cn(
              "p-1.5 rounded-r-md transition-colors",
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <LayoutList className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2.5">
          <Checkbox
            checked={selectedIds.size === filtered.length}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAll}
            className="gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy All
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Content Grid/List */}
      {isLoading ? (
        <div
          className={cn(
            "gap-4",
            viewMode === "grid"
              ? "grid md:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col"
          )}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <FolderKanban className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="font-medium">No content yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {debouncedSearch
              ? `No results for "${debouncedSearch}"`
              : "Create content through the pipeline and save it to see it here."}
          </p>
          {!debouncedSearch && (
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/content/angles">Create Your First Post</Link>
            </Button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "gap-4",
            viewMode === "grid"
              ? "grid md:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col"
          )}
        >
          {filtered.map((post) => (
            <ContentCard
              key={post.id}
              post={post}
              selected={selectedIds.has(post.id)}
              onSelect={toggleSelect}
              onCopy={handleCopy}
              onDelete={handleDeleteSingle}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} posts?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected posts will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
