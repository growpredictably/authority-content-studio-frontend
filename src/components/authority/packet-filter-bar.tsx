"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PacketsListResponse } from "@/lib/api/types";

export type PacketFilter = "all" | "ready" | "calibrating" | "draft";

interface PacketFilterBarProps {
  activeFilter: PacketFilter;
  onFilterChange: (filter: PacketFilter) => void;
  summary: PacketsListResponse["summary"];
  readyCounts: { ready: number; calibrating: number; draft: number };
}

export function PacketFilterBar({
  activeFilter,
  onFilterChange,
  summary,
  readyCounts,
}: PacketFilterBarProps) {
  const filters: { key: PacketFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: summary.total },
    { key: "ready", label: "Flagship", count: readyCounts.ready },
    { key: "calibrating", label: "Core", count: readyCounts.calibrating },
    { key: "draft", label: "Emerging", count: readyCounts.draft },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((f) => (
        <Button
          key={f.key}
          variant={activeFilter === f.key ? "default" : "outline"}
          size="sm"
          className={cn("gap-1.5 text-xs")}
          onClick={() => onFilterChange(f.key)}
        >
          {f.label}
          <span
            className={cn(
              "rounded-full px-1.5 py-0 text-[10px]",
              activeFilter === f.key
                ? "bg-primary-foreground/20"
                : "bg-muted"
            )}
          >
            {f.count}
          </span>
        </Button>
      ))}
    </div>
  );
}
