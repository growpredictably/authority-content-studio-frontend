"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Brain, Loader2 } from "lucide-react";
import { KnowledgeCard } from "./knowledge-card";
import { useBrainLibrary, useBrainSearch } from "@/lib/api/hooks/use-brain-builder";
import type { ExternalKnowledge } from "@/lib/api/types";

interface BrainLibraryProps {
  authorId: string | undefined;
}

type EndorsementFilter = "" | "full" | "partial" | "anti_model" | "reference";

const filterButtons: { key: EndorsementFilter; label: string }[] = [
  { key: "", label: "All" },
  { key: "full", label: "Full" },
  { key: "partial", label: "Partial" },
  { key: "anti_model", label: "Anti-Model" },
  { key: "reference", label: "Reference" },
];

export function BrainLibrary({ authorId }: BrainLibraryProps) {
  const [filter, setFilter] = useState<EndorsementFilter>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExternalKnowledge[] | null>(
    null
  );

  const { data, isLoading } = useBrainLibrary(
    authorId,
    filter || undefined
  );
  const brainSearch = useBrainSearch();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim() || !authorId) return;

    brainSearch.mutate(
      { author_id: authorId, query: searchQuery.trim(), top_k: 20 },
      {
        onSuccess: (res) => {
          setSearchResults(res.results.map((r) => r.knowledge));
        },
      }
    );
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchResults(null);
  }

  const items = searchResults ?? data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          <h3 className="text-sm font-medium">Knowledge Library</h3>
          {data && (
            <Badge variant="secondary" className="text-xs tabular-nums">
              {data.total_count}
            </Badge>
          )}
        </div>
        {data?.by_endorsement && (
          <div className="flex gap-1.5 text-[10px] text-muted-foreground">
            <span>{data.by_endorsement.full} full</span>
            <span>{data.by_endorsement.partial} partial</span>
            <span>{data.by_endorsement.anti_model} anti</span>
            <span>{data.by_endorsement.reference} ref</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search your brain semantically..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button
          type="submit"
          variant="outline"
          size="icon"
          disabled={!searchQuery.trim() || brainSearch.isPending}
        >
          {brainSearch.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      {searchResults && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {searchResults.length} results for &ldquo;{searchQuery}&rdquo;
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={clearSearch}
          >
            Clear search
          </Button>
        </div>
      )}

      {!searchResults && (
        <div className="flex gap-1.5 flex-wrap">
          {filterButtons.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <Brain className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {searchResults
              ? "No results found. Try a different search."
              : "No knowledge items yet. Curate a URL above to get started."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <KnowledgeCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
