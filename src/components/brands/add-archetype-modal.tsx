"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateAuthor } from "@/lib/api/hooks/use-authors";
import { Loader2, UserPlus } from "lucide-react";

interface AddArchetypeModalProps {
  brandId: string;
  authorName: string;
}

export function AddArchetypeModal({ brandId, authorName }: AddArchetypeModalProps) {
  const [open, setOpen] = useState(false);
  const createAuthor = useCreateAuthor();

  const [archetype, setArchetype] = useState("");
  const [archetypeDescription, setArchetypeDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setArchetype("");
    setArchetypeDescription("");
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    try {
      await createAuthor.mutateAsync({
        name: authorName,
        brand_id: brandId,
        archetype: archetype.trim() || "general",
        archetype_description: archetypeDescription.trim() || undefined,
        is_primary: false,
      });
      reset();
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create archetype";
      setError(msg);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <UserPlus className="h-3.5 w-3.5" />
          Add Archetype
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Archetype for {authorName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Create an additional voice archetype (e.g., Podcast Host, Keynote Speaker)
            for the same person under the same brand.
          </p>

          <div>
            <Label htmlFor="archetype-name">Archetype *</Label>
            <Input
              id="archetype-name"
              value={archetype}
              onChange={(e) => setArchetype(e.target.value)}
              placeholder="e.g., podcast_host"
            />
          </div>

          <div>
            <Label htmlFor="archetype-desc">Description</Label>
            <Input
              id="archetype-desc"
              value={archetypeDescription}
              onChange={(e) => setArchetypeDescription(e.target.value)}
              placeholder="e.g., Conversational tone for podcast episodes"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!archetype.trim() || createAuthor.isPending}
            >
              {createAuthor.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create Archetype"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
