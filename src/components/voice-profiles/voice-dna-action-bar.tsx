"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Pencil, Mic, Zap, Loader2 } from "lucide-react";
import { useUpdateAuthor } from "@/lib/api/hooks/use-authors";
import { useResynthesizeVoice } from "@/lib/api/hooks/use-voice-builder";
import { EditDetailsDialog } from "./edit-details-dialog";
import { ALL_SYNTHESIS_ELEMENTS } from "@/lib/voice-profiles/constants";
import { toast } from "sonner";

interface VoiceDnaActionBarProps {
  authorId: string;
  userId: string;
  authorName: string;
  archetype?: string;
  archetypeDescription?: string;
}

const ELEMENT_LABELS: Record<string, string> = {
  tone: "Tone",
  quotes: "Quotes",
  stories: "Stories",
  internal_knowledge: "Internal Knowledge",
  experience: "Experience",
  perspectives: "Perspectives",
  preferences: "Preferences",
  external_knowledge: "External Knowledge",
  frameworks: "Frameworks",
};

export function VoiceDnaActionBar({
  authorId,
  userId,
  authorName,
  archetype,
  archetypeDescription,
}: VoiceDnaActionBarProps) {
  const router = useRouter();
  const updateAuthor = useUpdateAuthor();
  const resynthMutation = useResynthesizeVoice();

  const [editOpen, setEditOpen] = useState(false);
  const [selectedElements, setSelectedElements] = useState<Set<string>>(
    () => new Set(ALL_SYNTHESIS_ELEMENTS)
  );
  const [synthPopoverOpen, setSynthPopoverOpen] = useState(false);

  function handleEditSave(values: {
    name: string;
    archetype: string;
    archetype_description: string;
  }) {
    updateAuthor.mutate(
      { authorId, updates: values },
      {
        onSuccess: () => {
          toast.success("Author details updated");
          setEditOpen(false);
        },
        onError: (e) => toast.error(`Update failed: ${e.message}`),
      }
    );
  }

  function handleToggleElement(element: string) {
    setSelectedElements((prev) => {
      const next = new Set(prev);
      if (next.has(element)) {
        next.delete(element);
      } else {
        next.add(element);
      }
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedElements(new Set(ALL_SYNTHESIS_ELEMENTS));
  }

  function handleDeselectAll() {
    setSelectedElements(new Set());
  }

  function handleSynthesize() {
    const exclude = ALL_SYNTHESIS_ELEMENTS.filter(
      (e) => !selectedElements.has(e)
    );
    resynthMutation.mutate(
      { author_id: authorId, user_id: userId, exclude: [...exclude] },
      {
        onSuccess: () => {
          toast.success(
            `Synthesizing ${selectedElements.size} element${selectedElements.size === 1 ? "" : "s"}...`
          );
          setSynthPopoverOpen(false);
        },
        onError: (e) => toast.error(`Synthesis failed: ${e.message}`),
      }
    );
  }

  const allSelected = selectedElements.size === ALL_SYNTHESIS_ELEMENTS.length;

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        {/* Edit Details */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
          Edit Details
        </Button>

        {/* Train Voice */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => router.push(`/voice?author=${authorId}`)}
        >
          <Mic className="h-4 w-4" />
          Train Voice
        </Button>

        {/* Synthesize Voice */}
        <Popover open={synthPopoverOpen} onOpenChange={setSynthPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="default" size="sm" className="gap-1.5">
              <Zap className="h-4 w-4" />
              Synthesize Voice
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Elements</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-0.5 px-1.5 text-xs"
                  onClick={allSelected ? handleDeselectAll : handleSelectAll}
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="space-y-2">
                {ALL_SYNTHESIS_ELEMENTS.map((element) => (
                  <label
                    key={element}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedElements.has(element)}
                      onCheckedChange={() => handleToggleElement(element)}
                    />
                    {ELEMENT_LABELS[element] || element}
                  </label>
                ))}
              </div>
              <Button
                className="w-full"
                size="sm"
                disabled={
                  selectedElements.size === 0 || resynthMutation.isPending
                }
                onClick={handleSynthesize}
              >
                {resynthMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Synthesize ({selectedElements.size})
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Edit Details Dialog */}
      <EditDetailsDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        name={authorName}
        archetype={archetype}
        archetypeDescription={archetypeDescription}
        onSave={handleEditSave}
        isSaving={updateAuthor.isPending}
      />
    </>
  );
}
