"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2, Plus } from "lucide-react";

interface DnaElementEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionKey: string;
  sectionTitle: string;
  data: unknown;
  onSave: (data: unknown) => void;
  isSaving: boolean;
}

export function DnaElementEditor({
  open,
  onOpenChange,
  sectionKey,
  sectionTitle,
  data,
  onSave,
  isSaving,
}: DnaElementEditorProps) {
  const [editValue, setEditValue] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (open && data !== undefined) {
      setEditValue(JSON.stringify(data, null, 2));
      setParseError(null);
    }
  }, [open, data]);

  function handleSave() {
    try {
      const parsed = JSON.parse(editValue);
      setParseError(null);
      onSave(parsed);
    } catch {
      setParseError("Invalid JSON. Please fix syntax errors before saving.");
    }
  }

  const isArray = Array.isArray(data);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit {sectionTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 space-y-3 overflow-y-auto">
          {isArray ? (
            <ArrayEditor
              value={editValue}
              onChange={(val) => {
                setEditValue(val);
                setParseError(null);
              }}
              sectionKey={sectionKey}
            />
          ) : (
            <Textarea
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                setParseError(null);
              }}
              rows={20}
              className="font-mono text-xs resize-y"
              placeholder="Edit JSON data..."
            />
          )}
          {parseError && (
            <p className="text-xs text-destructive">{parseError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-1.5">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ArrayEditor({
  value,
  onChange,
  sectionKey,
}: {
  value: string;
  onChange: (val: string) => void;
  sectionKey: string;
}) {
  let items: unknown[];
  try {
    items = JSON.parse(value);
    if (!Array.isArray(items)) items = [];
  } catch {
    // Fall back to raw text editor if JSON is malformed
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={20}
        className="font-mono text-xs resize-y"
        placeholder="Edit JSON array..."
      />
    );
  }

  function updateItem(index: number, newVal: string) {
    try {
      const parsed = JSON.parse(newVal);
      const updated = [...items];
      updated[index] = parsed;
      onChange(JSON.stringify(updated, null, 2));
    } catch {
      // Let user keep editing — don't update until valid
    }
  }

  function removeItem(index: number) {
    const updated = items.filter((_, i) => i !== index);
    onChange(JSON.stringify(updated, null, 2));
  }

  function addItem() {
    const template = getTemplate(sectionKey);
    const updated = [...items, template];
    onChange(JSON.stringify(updated, null, 2));
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {items.length} {items.length === 1 ? "item" : "items"}
      </p>
      {items.map((item, idx) => (
        <div key={idx} className="relative group">
          <div className="flex items-start gap-2">
            <span className="text-xs text-muted-foreground mt-2 w-6 shrink-0 text-right">
              {idx + 1}.
            </span>
            <Textarea
              defaultValue={JSON.stringify(item, null, 2)}
              onBlur={(e) => updateItem(idx, e.target.value)}
              rows={Math.min(
                10,
                Math.max(3, JSON.stringify(item, null, 2).split("\n").length)
              )}
              className="font-mono text-xs flex-1 resize-y"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(idx)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={addItem}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Item
      </Button>
    </div>
  );
}

function getTemplate(sectionKey: string): Record<string, unknown> {
  switch (sectionKey) {
    case "stories":
      return {
        internal_title: "New Story",
        narrative_arc: {
          the_setup: "",
          the_conflict: "",
          the_resolution: "",
          lesson: "",
        },
      };
    case "quotes":
      return { quote: "", context: "", themes: [] };
    case "perspectives":
      return { label: "", stance: "", domain: "" };
    case "frameworks":
      return {
        name: "New Framework",
        purpose_overview: "",
        core_promise: "",
        steps_or_phases: [],
      };
    case "knowledge":
      return { domain: "", key_concepts: [], tools: [] };
    case "experience":
      return { role: "", company: "", key_achievement: "" };
    default:
      return {};
  }
}
