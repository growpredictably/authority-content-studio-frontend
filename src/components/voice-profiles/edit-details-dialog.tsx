"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface EditDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  archetype?: string;
  archetypeDescription?: string;
  onSave: (values: {
    name: string;
    archetype: string;
    archetype_description: string;
  }) => void;
  isSaving?: boolean;
}

export function EditDetailsDialog({
  open,
  onOpenChange,
  name,
  archetype,
  archetypeDescription,
  onSave,
  isSaving,
}: EditDetailsDialogProps) {
  const [formName, setFormName] = useState(name);
  const [formArchetype, setFormArchetype] = useState(archetype || "");
  const [formDescription, setFormDescription] = useState(
    archetypeDescription || ""
  );

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormName(name);
      setFormArchetype(archetype || "");
      setFormDescription(archetypeDescription || "");
    }
  }, [open, name, archetype, archetypeDescription]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name: formName.trim(),
      archetype: formArchetype.trim(),
      archetype_description: formDescription.trim(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Author Details</DialogTitle>
          <DialogDescription>
            Update the name, archetype, and description for this voice profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="author-name">Name</Label>
            <Input
              id="author-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Author name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author-archetype">Archetype</Label>
            <Input
              id="author-archetype"
              value={formArchetype}
              onChange={(e) => setFormArchetype(e.target.value)}
              placeholder="e.g. general, podcast-host"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author-description">Archetype Description</Label>
            <Textarea
              id="author-description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe this archetype..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !formName.trim()}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
