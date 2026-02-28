"use client";

import { useState } from "react";
import { usePipeline } from "@/lib/content-pipeline/pipeline-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ChevronDown,
  Lightbulb,
  BookOpen,
  Quote,
  Brain,
  Target,
} from "lucide-react";
import type { AnglesContext } from "@/lib/api/types";

interface RefineIngredientsProps {
  onApprove: (context: AnglesContext) => void;
}

export function RefineIngredients({ onApprove }: RefineIngredientsProps) {
  const { state } = usePipeline();
  const angle = state.selectedAngle;
  const context = state.anglesContext;

  // Local editing state
  const [editedBrief, setEditedBrief] = useState(
    angle?.strategic_brief || ""
  );
  const [selectedInsights, setSelectedInsights] = useState<Set<string>>(
    () => {
      const ids = new Set<string>();
      context?.key_insights?.forEach((insight) => {
        if (insight.selected !== false) ids.add(insight.id);
      });
      return ids;
    }
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  if (!angle || !context) return null;

  function toggleInsight(id: string) {
    setSelectedInsights((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSection(key: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleApprove() {
    const approved: AnglesContext = {
      ...context,
      key_insights: context?.key_insights?.map((insight) => ({
        ...insight,
        selected: selectedInsights.has(insight.id),
      })),
    };
    onApprove(approved);
  }

  const contextSections = [
    {
      key: "stories",
      label: "Stories",
      icon: BookOpen,
      data: context.stories,
    },
    {
      key: "frameworks",
      label: "Frameworks",
      icon: Brain,
      data: context.frameworks,
    },
    {
      key: "perspectives",
      label: "Perspectives",
      icon: Lightbulb,
      data: context.perspectives,
    },
    {
      key: "quotes",
      label: "Quotes",
      icon: Quote,
      data: context.quotes,
    },
    {
      key: "icp_pains",
      label: "ICP Pain Points",
      icon: Target,
      data: context.icp_pains,
    },
    {
      key: "experience",
      label: "Experience",
      icon: BookOpen,
      data: context.experience,
    },
    {
      key: "knowledge",
      label: "Knowledge",
      icon: Brain,
      data: context.knowledge,
    },
    {
      key: "external_knowledge",
      label: "External Knowledge",
      icon: Brain,
      data: context.external_knowledge,
    },
  ].filter((s) => Array.isArray(s.data) && s.data.length > 0);

  return (
    <div className="space-y-4">
      {/* Selected angle summary */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground mb-1">Selected Angle</p>
          <p className="text-sm font-medium">
            {angle.angle_title || angle.title}
          </p>
          {angle.target_audience && (
            <Badge variant="secondary" className="mt-1 mr-1 text-xs">
              {angle.target_audience}
            </Badge>
          )}
          {angle.target_metric && (
            <Badge variant="outline" className="mt-1 text-xs">
              {angle.target_metric}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Editable strategic brief */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Strategic Brief</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={editedBrief}
            onChange={(e) => setEditedBrief(e.target.value)}
            className="min-h-[80px] text-sm resize-y"
            placeholder="Describe the angle's strategic direction..."
          />
        </CardContent>
      </Card>

      {/* Key insights as toggleable cards */}
      {context.key_insights && context.key_insights.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4" />
            Key Insights
            <span className="text-xs text-muted-foreground">
              ({selectedInsights.size}/{context.key_insights.length} selected)
            </span>
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {context.key_insights.map((insight) => {
              const isSelected = selectedInsights.has(insight.id);
              return (
                <Card
                  key={insight.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    isSelected
                      ? "border-primary/50 bg-primary/5"
                      : "opacity-60 hover:opacity-80"
                  )}
                  onClick={() => toggleInsight(insight.id)}
                >
                  <CardContent className="pt-3 pb-2 space-y-1">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={isSelected}
                        className="mt-0.5"
                        onCheckedChange={() => toggleInsight(insight.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          {insight.headline}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {insight.description}
                        </p>
                        {insight.source_quote && (
                          <p className="text-xs italic text-muted-foreground/70 mt-1">
                            &ldquo;{insight.source_quote}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Context sections (collapsible) */}
      {contextSections.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Supporting Context</h4>
          {contextSections.map((section) => {
            const Icon = section.icon;
            const isOpen = expandedSections.has(section.key);
            return (
              <Collapsible
                key={section.key}
                open={isOpen}
                onOpenChange={() => toggleSection(section.key)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 w-full justify-start"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                    <Icon className="h-3.5 w-3.5" />
                    {section.label}
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {(section.data as unknown[]).length}
                    </Badge>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1 ml-6 space-y-1">
                  {(section.data as Record<string, unknown>[]).map(
                    (item, idx) => {
                      const title =
                        (item.name as string) ||
                        (item.label as string) ||
                        (item.title as string) ||
                        (item.internal_title as string) ||
                        (item.belief_statement as string) ||
                        (item.pain_title as string) ||
                        `Item ${idx + 1}`;
                      return (
                        <div
                          key={idx}
                          className="rounded border px-3 py-2 text-xs text-muted-foreground"
                        >
                          {title}
                        </div>
                      );
                    }
                  )}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* ICP profile */}
      {context.icp_profile && Object.keys(context.icp_profile).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Target className="h-4 w-4" />
              ICP Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {context.icp_profile.name ? (
              <p className="font-medium text-foreground">
                {String(context.icp_profile.name)}
              </p>
            ) : null}
            {context.icp_profile.demographics ? (
              <p className="mt-1">
                {String(context.icp_profile.demographics)}
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Tone */}
      {context.tone && Object.keys(context.tone).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tone Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1">
            {Object.entries(context.tone).map(([key, val]) => (
              <Badge key={key} variant="outline" className="text-xs">
                {key}: {String(val)}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Approve button */}
      <Button onClick={handleApprove} className="gap-2">
        <ArrowRight className="h-4 w-4" />
        Generate Outline
      </Button>
    </div>
  );
}
