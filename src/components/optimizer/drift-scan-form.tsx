"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DriftScanRequest } from "@/lib/api/types";

type PersonaTag = "corporate" | "venture" | "legacy";

const personaOptions: {
  value: PersonaTag;
  label: string;
  description: string;
}[] = [
  {
    value: "corporate",
    label: "Corporate",
    description: "Executive authority, P&L, scale",
  },
  {
    value: "venture",
    label: "Venture",
    description: "Innovation, advisory, market creation",
  },
  {
    value: "legacy",
    label: "Legacy",
    description: "Foundational credibility, career arc",
  },
];

interface DriftScanFormProps {
  sectionName: string;
  authorId: string;
  sourceContent: string;
  brandId?: string;
  isLoading: boolean;
  onSubmit: (request: DriftScanRequest) => void;
}

export function DriftScanForm({
  sectionName,
  authorId,
  sourceContent,
  brandId,
  isLoading,
  onSubmit,
}: DriftScanFormProps) {
  const [enrichmentContext, setEnrichmentContext] = useState("");
  const [personaTag, setPersonaTag] = useState<PersonaTag | undefined>();
  const [personaGoal, setPersonaGoal] = useState("");
  const [enableResearch, setEnableResearch] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const request: DriftScanRequest = {
      author_id: authorId,
      source_content: sourceContent,
      target_section_name: sectionName,
      ...(brandId && { brand_id: brandId }),
      ...(enrichmentContext && { enrichment_context: enrichmentContext }),
      ...(personaTag && { persona_tag: personaTag }),
      ...(personaGoal && { persona_goal: personaGoal }),
      ...(enableResearch && { enable_research: true }),
    };

    onSubmit(request);
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <CardTitle className="text-sm">Drift Scan Configuration</CardTitle>
          <Badge variant="outline" className="text-xs">
            {sectionName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="enrichment">Enrichment Context</Label>
            <Textarea
              id="enrichment"
              placeholder="Add facts, metrics, wins, and context you want reflected in this section..."
              value={enrichmentContext}
              onChange={(e) => setEnrichmentContext(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Optional. Providing context leads to more targeted suggestions.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Persona Tag</Label>
            <div className="grid grid-cols-3 gap-2">
              {personaOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setPersonaTag(personaTag === opt.value ? undefined : opt.value)
                  }
                  className={cn(
                    "flex flex-col items-start rounded-lg border p-3 text-left transition-colors hover:bg-accent",
                    personaTag === opt.value &&
                      "border-primary bg-primary/5 ring-1 ring-primary"
                  )}
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {personaTag && (
            <div className="space-y-2">
              <Label htmlFor="persona-goal">Persona Goal</Label>
              <Input
                id="persona-goal"
                placeholder="I want this role to signal that I can..."
                value={personaGoal}
                onChange={(e) => setPersonaGoal(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="research" className="cursor-pointer">
                Enable Research
              </Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Searches for authority signals and market positioning data to
                  inform suggestions. Takes slightly longer but produces
                  research-backed recommendations.
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              id="research"
              checked={enableResearch}
              onCheckedChange={setEnableResearch}
            />
          </div>

          <Button type="submit" className="w-full gap-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Suggestions
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
