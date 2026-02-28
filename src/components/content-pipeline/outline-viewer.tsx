"use client";

import { useState, useCallback } from "react";
import { usePipeline } from "@/lib/content-pipeline/pipeline-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ExternalLink,
  Loader2,
  PenTool,
  Plus,
  Sparkles,
  Trash2,
  X,
  LayoutTemplate,
  Check,
} from "lucide-react";
import type {
  OutlineHook,
  OutlineSection,
  GenerateOutlineResponse,
  TemplateRecommendation,
} from "@/lib/api/types";

interface OutlineViewerProps {
  onWrite: () => void;
  isWriting: boolean;
}

export function OutlineViewer({ onWrite, isWriting }: OutlineViewerProps) {
  const { state, selectHook, setEditedOutline, selectTemplate } = usePipeline();
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  if (!state.outline) return null;

  const outline = state.editedOutline ?? state.outline;
  const sections = outline.sections?.length
    ? outline.sections
    : outline.outline ?? [];
  const isPost = state.contentType === "linkedin_post";

  // ─── Editing helpers ─────────────────────────────────────────

  function updateOutline(updater: (prev: GenerateOutlineResponse) => GenerateOutlineResponse) {
    const current = state.editedOutline ?? { ...state.outline! };
    setEditedOutline(updater(current));
  }

  function updateSection(idx: number, updated: OutlineSection) {
    updateOutline((prev) => {
      const arr = [...(prev.sections?.length ? prev.sections : prev.outline ?? [])];
      arr[idx] = updated;
      return { ...prev, sections: arr };
    });
  }

  function removeSection(idx: number) {
    updateOutline((prev) => {
      const arr = [...(prev.sections?.length ? prev.sections : prev.outline ?? [])];
      arr.splice(idx, 1);
      return { ...prev, sections: arr };
    });
  }

  function moveSection(idx: number, direction: -1 | 1) {
    const target = idx + direction;
    if (target < 0 || target >= sections.length) return;
    updateOutline((prev) => {
      const arr = [...(prev.sections?.length ? prev.sections : prev.outline ?? [])];
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return { ...prev, sections: arr };
    });
  }

  function addSection() {
    updateOutline((prev) => {
      const arr = [...(prev.sections?.length ? prev.sections : prev.outline ?? [])];
      arr.push({ heading: "New Section", key_points: ["Key point"] });
      return { ...prev, sections: arr };
    });
  }

  function updateKeyPoint(sectionIdx: number, pointIdx: number, value: string) {
    const section = sections[sectionIdx];
    const points = [...(section.key_points || [])];
    points[pointIdx] = value;
    updateSection(sectionIdx, { ...section, key_points: points });
  }

  function removeKeyPoint(sectionIdx: number, pointIdx: number) {
    const section = sections[sectionIdx];
    const points = [...(section.key_points || [])];
    points.splice(pointIdx, 1);
    updateSection(sectionIdx, { ...section, key_points: points });
  }

  function addKeyPoint(sectionIdx: number) {
    const section = sections[sectionIdx];
    const points = [...(section.key_points || []), ""];
    updateSection(sectionIdx, { ...section, key_points: points });
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Selected angle header */}
      {state.selectedAngle && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground mb-1">
              Selected Angle
            </p>
            <p className="text-sm font-medium">
              {state.selectedAngle.angle_title || state.selectedAngle.title}
            </p>
            {state.selectedAngle.strategic_brief && (
              <p className="text-xs text-muted-foreground mt-1">
                {state.selectedAngle.strategic_brief}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Title */}
      <div>
        <h3 className="text-lg font-semibold">{outline.title}</h3>
        {outline.output_content_type && (
          <Badge variant="outline" className="mt-1 text-xs">
            {outline.output_content_type}
          </Badge>
        )}
      </div>

      {/* Hook selector */}
      {outline.hooks && outline.hooks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Choose a Hook</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {outline.hooks.map((hook, idx) => {
              const isSelected = state.selectedHook?.text === hook.text;
              return (
                <Card
                  key={hook.id || idx}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50",
                    isSelected && "border-primary ring-1 ring-primary"
                  )}
                  onClick={() => selectHook(hook)}
                >
                  <CardContent className="pt-4 pb-3 space-y-1">
                    <p className="text-sm leading-snug">{hook.text}</p>
                    <div className="flex items-center gap-2">
                      {(hook.hook_type || hook.type) && (
                        <Badge variant="secondary" className="text-xs">
                          {hook.hook_type || hook.type}
                        </Badge>
                      )}
                    </div>
                    {hook.rationale && (
                      <p className="text-xs text-muted-foreground">
                        {hook.rationale}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Editable sections */}
      {sections.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Outline Sections</h4>
          <div className="space-y-2">
            {sections.map((section, idx) => (
              <Card key={idx}>
                <CardContent className="pt-4 pb-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={
                        section.heading ||
                        section.section_type ||
                        `Section ${idx + 1}`
                      }
                      onChange={(e) =>
                        updateSection(idx, {
                          ...section,
                          heading: e.target.value,
                        })
                      }
                      className="text-sm font-medium h-8"
                    />
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveSection(idx, -1)}
                        disabled={idx === 0}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveSection(idx, 1)}
                        disabled={idx === sections.length - 1}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeSection(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {section.purpose && (
                    <p className="text-xs text-muted-foreground">
                      {section.purpose}
                    </p>
                  )}
                  {section.key_points && section.key_points.length > 0 && (
                    <ul className="space-y-1 ml-4">
                      {section.key_points.map((point, pIdx) => (
                        <li key={pIdx} className="flex items-center gap-1">
                          <span className="text-muted-foreground text-xs">
                            &bull;
                          </span>
                          <Input
                            value={point}
                            onChange={(e) =>
                              updateKeyPoint(idx, pIdx, e.target.value)
                            }
                            className="text-xs h-7 flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => removeKeyPoint(idx, pIdx)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.talking_points &&
                    section.talking_points.length > 0 &&
                    !section.key_points?.length && (
                      <ul className="space-y-1 ml-4">
                        {section.talking_points.map((point, pIdx) => (
                          <li
                            key={pIdx}
                            className="text-xs text-muted-foreground list-disc"
                          >
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => addKeyPoint(idx)}
                  >
                    <Plus className="h-3 w-3" />
                    Add Point
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={addSection}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Section
          </Button>
        </div>
      )}

      {/* CTA */}
      {outline.cta && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground mb-1">
              Call to Action
            </p>
            <p className="text-sm">{outline.cta}</p>
          </CardContent>
        </Card>
      )}

      {/* Template recommendations */}
      {outline.recommendations && outline.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <LayoutTemplate className="h-4 w-4" />
            Recommended Templates
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {outline.recommendations.map((rec, idx) => {
              const isSelected =
                state.selectedTemplate?.template_name === rec.template_name;
              return (
                <Card
                  key={idx}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50",
                    isSelected && "border-primary ring-1 ring-primary"
                  )}
                  onClick={() =>
                    selectTemplate(isSelected ? null : rec)
                  }
                >
                  <CardContent className="pt-3 pb-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {rec.template_name}
                      </p>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    {rec.rationale && (
                      <p className="text-xs text-muted-foreground">
                        {rec.rationale}
                      </p>
                    )}
                    {rec.match_score != null && (
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(rec.match_score * 100)}% match
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Supporting evidence */}
      {state.outline?.supporting_evidence &&
        state.outline.supporting_evidence.length > 0 && (
          <Collapsible open={evidenceOpen} onOpenChange={setEvidenceOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 w-full">
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    evidenceOpen && "rotate-180"
                  )}
                />
                Supporting Evidence (
                {state.outline.supporting_evidence.length})
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {state.outline.supporting_evidence.map((ev, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-3 pb-2 space-y-1">
                    {ev.title && (
                      <p className="text-xs font-medium">{ev.title}</p>
                    )}
                    {ev.snippet && (
                      <p className="text-xs text-muted-foreground">
                        {ev.snippet}
                      </p>
                    )}
                    {ev.stat_summary && (
                      <p className="text-xs text-muted-foreground">
                        {ev.stat_summary}
                      </p>
                    )}
                    {ev.url && (
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Source
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

      {/* SEO metadata for articles */}
      {outline.seo_metadata && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">SEO Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            {outline.seo_metadata.primary_keyword && (
              <p>
                <span className="text-muted-foreground">Primary: </span>
                <Badge variant="secondary" className="text-xs">
                  {outline.seo_metadata.primary_keyword}
                </Badge>
              </p>
            )}
            {outline.seo_metadata.secondary_keywords &&
              outline.seo_metadata.secondary_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {outline.seo_metadata.secondary_keywords.map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              )}
            {outline.seo_metadata.meta_description && (
              <p className="text-muted-foreground mt-1">
                {outline.seo_metadata.meta_description}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Write button */}
      <Button onClick={onWrite} disabled={isWriting} className="gap-2">
        {isWriting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPost ? (
          <PenTool className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isWriting
          ? "Writing..."
          : isPost
            ? "Write Post"
            : "Write Article"}
      </Button>
    </div>
  );
}
