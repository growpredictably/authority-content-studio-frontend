"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdateKnowledge } from "@/lib/api/hooks/use-brain-builder";
import type { ExternalKnowledge } from "@/lib/api/types";

interface EditKnowledgeDrawerProps {
  knowledge: ExternalKnowledge;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const endorsementOptions = [
  { value: "full", label: "Full", description: "I stand behind this completely" },
  { value: "partial", label: "Partial", description: "Useful, but I don't fully agree" },
  { value: "anti_model", label: "Anti-Model", description: "I disagree — what I argue against" },
  { value: "reference", label: "Reference", description: "Good to know, not my stance" },
] as const;

export function EditKnowledgeDrawer({
  knowledge,
  open,
  onOpenChange,
}: EditKnowledgeDrawerProps) {
  const [title, setTitle] = useState(knowledge.title);
  const [summary, setSummary] = useState(knowledge.summary);
  const [endorsementLevel, setEndorsementLevel] = useState(knowledge.endorsement_level);
  const [userNotes, setUserNotes] = useState(knowledge.user_notes ?? "");
  const [tagsInput, setTagsInput] = useState(knowledge.strategic_tags.join(", "));

  const updateKnowledge = useUpdateKnowledge();

  // Reset form when knowledge prop changes
  useEffect(() => {
    setTitle(knowledge.title);
    setSummary(knowledge.summary);
    setEndorsementLevel(knowledge.endorsement_level);
    setUserNotes(knowledge.user_notes ?? "");
    setTagsInput(knowledge.strategic_tags.join(", "));
  }, [knowledge]);

  function handleSave() {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    updateKnowledge.mutate(
      {
        knowledge_id: knowledge.id,
        updates: {
          title,
          summary,
          endorsement_level: endorsementLevel,
          user_notes: userNotes || undefined,
          strategic_tags: tags,
        },
      },
      {
        onSuccess: () => {
          toast.success("Knowledge item updated");
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to update knowledge item");
        },
      }
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Edit Knowledge</SheetTitle>
          <SheetDescription className="text-left">
            Update this knowledge item&apos;s details and endorsement level.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          <div className="space-y-2">
            <Label htmlFor="ek-title">Title</Label>
            <Input
              id="ek-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ek-summary">Summary</Label>
            <Textarea
              id="ek-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Endorsement Level</Label>
            <Select
              value={endorsementLevel}
              onValueChange={(v) =>
                setEndorsementLevel(v as ExternalKnowledge["endorsement_level"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {endorsementOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-muted-foreground ml-1 text-xs">
                      — {opt.description}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ek-notes">Your Notes</Label>
            <Textarea
              id="ek-notes"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              rows={3}
              placeholder="Personal annotations..."
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ek-tags">Strategic Tags</Label>
            <Input
              id="ek-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
            <p className="text-[10px] text-muted-foreground">
              Comma-separated list of tags
            </p>
          </div>

          <Separator />

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={updateKnowledge.isPending || !title.trim() || !summary.trim()}
              className="flex-1"
            >
              {updateKnowledge.isPending && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Save Changes
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={updateKnowledge.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
