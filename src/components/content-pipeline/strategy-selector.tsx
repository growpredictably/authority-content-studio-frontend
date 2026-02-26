"use client";

import { usePipeline } from "@/lib/content-pipeline/pipeline-context";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Lightbulb, Youtube, BarChart3 } from "lucide-react";
import type { ContentStrategy, PipelineContentType } from "@/lib/api/types";

const strategies: {
  key: ContentStrategy;
  label: string;
  description: string;
  icon: typeof Lightbulb;
}[] = [
  {
    key: "linkedin_posts",
    label: "Raw Idea",
    description: "Start from a topic, insight, or rough idea",
    icon: Lightbulb,
  },
  {
    key: "YouTube",
    label: "YouTube Video",
    description: "Extract angles from a YouTube video",
    icon: Youtube,
  },
  {
    key: "MarketAnalysis",
    label: "Market Analysis",
    description: "Analyze a market topic for authority angles",
    icon: BarChart3,
  },
];

const contentTypes: { key: PipelineContentType; label: string }[] = [
  { key: "linkedin_post", label: "LinkedIn Post" },
  { key: "linkedin_article", label: "LinkedIn Article" },
  { key: "seo_article", label: "SEO Article" },
];

export function StrategySelector() {
  const { state, setSource } = usePipeline();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-3">Choose your source</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {strategies.map((s) => {
            const Icon = s.icon;
            const isSelected = state.strategy === s.key;
            return (
              <Card
                key={s.key}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  isSelected && "border-primary ring-1 ring-primary"
                )}
                onClick={() => setSource(s.key, state.contentType)}
              >
                <CardContent className="pt-6 text-center space-y-2">
                  <Icon
                    className={cn(
                      "h-8 w-8 mx-auto",
                      isSelected
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                  <p className="font-medium text-sm">{s.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Output format</h3>
        <Select
          value={state.contentType}
          onValueChange={(val) =>
            setSource(
              state.strategy ?? "linkedin_posts",
              val as PipelineContentType
            )
          }
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contentTypes.map((ct) => (
              <SelectItem key={ct.key} value={ct.key}>
                {ct.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
