"use client";

import { useAuthor } from "@/hooks/use-author";
import { useICPs } from "@/lib/api/hooks/use-icps";
import { usePipeline } from "@/lib/content-pipeline/pipeline-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Target, ChevronDown, Check } from "lucide-react";

export function ICPSelector() {
  const { author } = useAuthor();
  const { state, setSelectedIcp } = usePipeline();
  const { data: icpData } = useICPs(author?.id);
  const icps = icpData?.icps ?? [];

  if (!author || icps.length === 0) return null;

  const selectedIcp = icps.find((icp) => icp.id === state.selectedIcpId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent transition-colors">
          <Target className="h-3 w-3" />
          {selectedIcp ? selectedIcp.name : "All audiences"}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => setSelectedIcp(null)}
          className="gap-2 text-xs"
        >
          {!state.selectedIcpId ? (
            <Check className="h-3 w-3 text-primary" />
          ) : (
            <span className="w-3" />
          )}
          All audiences
        </DropdownMenuItem>
        {icps.map((icp) => (
          <DropdownMenuItem
            key={icp.id}
            onClick={() => setSelectedIcp(icp.id)}
            className="gap-2 text-xs"
          >
            {icp.id === state.selectedIcpId ? (
              <Check className="h-3 w-3 text-primary" />
            ) : (
              <span className="w-3" />
            )}
            {icp.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
