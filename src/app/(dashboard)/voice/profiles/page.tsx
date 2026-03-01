"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Mic, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAllAuthorsWithDna } from "@/lib/api/hooks/use-voice-builder";
import {
  useSetPrimaryAuthor,
  useDeleteAuthor,
} from "@/lib/api/hooks/use-authors";
import { ProfileCard } from "@/components/voice-profiles/profile-card";
import { DeleteAuthorDialog } from "@/components/voice-profiles/delete-author-dialog";
import type { AuthorWithBrand } from "@/lib/voice-profiles/types";
import { toast } from "sonner";

export default function VoiceProfilesPage() {
  const router = useRouter();
  const { data: authors, isLoading } = useAllAuthorsWithDna();
  const setPrimary = useSetPrimaryAuthor();
  const deleteAuthor = useDeleteAuthor();

  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AuthorWithBrand | null>(
    null
  );

  // Filter authors by search query
  const query = search.toLowerCase().trim();
  const filtered = (authors ?? []).filter((author) => {
    if (!query) return true;
    return (
      author.name.toLowerCase().includes(query) ||
      (author.brand?.name?.toLowerCase().includes(query) ?? false) ||
      (author.archetype?.toLowerCase().includes(query) ?? false)
    );
  }) as AuthorWithBrand[];

  function handleViewDna(authorId: string) {
    router.push(`/voice/profiles/${authorId}`);
  }

  function handleTrainVoice(authorId: string) {
    router.push(`/voice?author=${authorId}`);
  }

  function handleSetPrimary(authorId: string) {
    setPrimary.mutate(authorId, {
      onSuccess: () => toast.success("Primary author updated"),
      onError: (e) => toast.error(`Failed to set primary: ${e.message}`),
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteAuthor.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`${deleteTarget.name} deleted`);
        setDeleteTarget(null);
      },
      onError: (e) => toast.error(`Delete failed: ${e.message}`),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Mic className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Voice Profiles</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of all voice profiles across your brands
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, brand, or archetype..."
          className="pl-9 pr-9"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => setSearch("")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <Mic className="h-10 w-10 text-muted-foreground/40 mb-3" />
          {query ? (
            <>
              <h3 className="font-medium">
                No voice profiles match your search
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setSearch("")}
              >
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <h3 className="font-medium">No voice profiles yet</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Start by adding content through Voice Builder to build your
                first voice profile.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((author) => (
            <ProfileCard
              key={author.id}
              author={author}
              onViewDna={handleViewDna}
              onTrainVoice={handleTrainVoice}
              onSetPrimary={handleSetPrimary}
              onDelete={(id) => {
                const target = filtered.find((a) => a.id === id);
                if (target) setDeleteTarget(target);
              }}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteAuthorDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        authorName={deleteTarget?.name ?? ""}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteAuthor.isPending}
      />
    </div>
  );
}
