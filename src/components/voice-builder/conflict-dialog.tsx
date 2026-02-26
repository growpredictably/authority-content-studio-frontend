"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { IngestConflict, ConflictResolution } from "@/lib/api/types";

interface ConflictDialogProps {
  conflicts: IngestConflict[];
  open: boolean;
  onResolve: (resolutions: ConflictResolution[]) => void;
  isResolving: boolean;
}

const severityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-700",
};

export function ConflictDialog({
  conflicts,
  open,
  onResolve,
  isResolving,
}: ConflictDialogProps) {
  const [resolutions, setResolutions] = useState<Record<number, string>>({});

  function handleActionChange(index: number, action: string) {
    setResolutions((prev) => ({ ...prev, [index]: action }));
  }

  function handleSubmit() {
    const resolved: ConflictResolution[] = conflicts.map((_, i) => ({
      conflict_index: i,
      action: (resolutions[i] ?? "skip") as "merge" | "skip" | "force",
    }));
    onResolve(resolved);
  }

  const allResolved = conflicts.every((_, i) => resolutions[i]);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Conflicts Detected
          </DialogTitle>
          <DialogDescription>
            The Gatekeeper found {conflicts.length} potential issue
            {conflicts.length !== 1 ? "s" : ""}. Choose how to handle each one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {conflicts.map((conflict, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={severityColors[conflict.severity]}>
                  {conflict.severity}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {conflict.conflict_type.replace("_", " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {conflict.item_type}
                </span>
              </div>

              <p className="text-xs">{conflict.reason}</p>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded bg-muted p-2">
                  <p className="font-medium mb-0.5">New</p>
                  <p className="text-muted-foreground">
                    {conflict.new_item_summary.title}
                  </p>
                </div>
                <div className="rounded bg-muted p-2">
                  <p className="font-medium mb-0.5">Existing</p>
                  <p className="text-muted-foreground">
                    {conflict.existing_item_summary.title}
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground italic">
                Suggested: {conflict.suggested_action}
              </p>

              <Select
                value={resolutions[i] ?? ""}
                onValueChange={(v) => handleActionChange(i, v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Choose action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merge">
                    Merge (combine both)
                  </SelectItem>
                  <SelectItem value="force">
                    Force (keep new, override)
                  </SelectItem>
                  <SelectItem value="skip">
                    Skip (keep existing)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!allResolved || isResolving}
          className="w-full mt-2 gap-2"
        >
          {isResolving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          {isResolving ? "Resolving..." : "Apply Resolutions"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
