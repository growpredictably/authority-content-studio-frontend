"use client";

import { usePipeline } from "@/lib/content-pipeline/pipeline-context";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

interface SourceInputProps {
  onSubmit: () => void;
  isLoading: boolean;
}

export function SourceInput({ onSubmit, isLoading }: SourceInputProps) {
  const { state, setRawInput } = usePipeline();

  if (!state.strategy) return null;

  const canSubmit = state.rawInput.trim().length > 0 && !isLoading;

  return (
    <div className="space-y-3">
      {state.strategy === "YouTube" ? (
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            YouTube URL
          </label>
          <Input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={state.rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            disabled={isLoading}
          />
        </div>
      ) : (
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            {state.strategy === "MarketAnalysis"
              ? "Market topic or industry to analyze"
              : "Your idea, insight, or topic"}
          </label>
          <Textarea
            placeholder={
              state.strategy === "MarketAnalysis"
                ? "e.g. AI adoption challenges in enterprise B2B SaaS..."
                : "e.g. Why most thought leaders fail at consistency..."
            }
            value={state.rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            disabled={isLoading}
            rows={4}
          />
        </div>
      )}

      <Button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isLoading ? "Generating Angles..." : "Generate Angles"}
      </Button>
    </div>
  );
}
