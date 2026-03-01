"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FrameworkComponent } from "@/lib/api/types";

export function ComponentCard({ comp, index }: { comp: FrameworkComponent; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = (comp.key_points?.length ?? 0) > 0
    || (comp.examples?.length ?? 0) > 0
    || (comp.sub_components?.length ?? 0) > 0
    || (comp.best_practices?.length ?? 0) > 0
    || (comp.common_mistakes?.length ?? 0) > 0;

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={cn(
          "w-full text-left p-4",
          hasDetails && "cursor-pointer hover:bg-accent/30 transition-colors"
        )}
      >
        <div className="flex items-start gap-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground font-bold text-xs shrink-0 mt-0.5">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">{comp.name}</h4>
              {hasDetails && (
                expanded
                  ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
            </div>
            {comp.description && (
              <p className={cn(
                "text-xs text-muted-foreground leading-relaxed mt-1",
                !expanded && "line-clamp-2"
              )}>
                {comp.description}
              </p>
            )}
          </div>
        </div>
      </button>

      {expanded && hasDetails && (
        <div className="px-4 pb-4 space-y-4 border-t pt-4 ml-10">
          {comp.key_points && comp.key_points.length > 0 && (
            <div>
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Key Points</h5>
              <ul className="space-y-1.5">
                {comp.key_points.map((point, i) => (
                  <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                    <span className="text-primary mt-0.5 shrink-0">-</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {comp.examples && comp.examples.length > 0 && (
            <div>
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Examples</h5>
              <div className="space-y-2">
                {comp.examples.map((ex, i) => (
                  <div key={i} className="rounded-md border border-dashed p-3 space-y-1">
                    {ex.context && (
                      <p className="text-xs"><span className="font-medium text-foreground">Context:</span> <span className="text-muted-foreground">{ex.context}</span></p>
                    )}
                    {ex.implementation && (
                      <p className="text-xs"><span className="font-medium text-foreground">Implementation:</span> <span className="text-muted-foreground">{ex.implementation}</span></p>
                    )}
                    {ex.outcome && (
                      <p className="text-xs"><span className="font-medium text-foreground">Outcome:</span> <span className="text-muted-foreground">{ex.outcome}</span></p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {comp.sub_components && comp.sub_components.length > 0 && (
            <div>
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Sub Components</h5>
              <ul className="space-y-1.5">
                {comp.sub_components.map((sub, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">{sub.name}:</span> {sub.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {((comp.best_practices?.length ?? 0) > 0 || (comp.common_mistakes?.length ?? 0) > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {comp.best_practices && comp.best_practices.length > 0 && (
                <div>
                  <h5 className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    <CheckCircle2 className="h-3 w-3" /> Best Practices
                  </h5>
                  <ul className="space-y-1">
                    {comp.best_practices.map((bp, i) => (
                      <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                        <span className="shrink-0">-</span>
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {comp.common_mistakes && comp.common_mistakes.length > 0 && (
                <div>
                  <h5 className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    <AlertTriangle className="h-3 w-3" /> Common Mistakes
                  </h5>
                  <ul className="space-y-1">
                    {comp.common_mistakes.map((cm, i) => (
                      <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                        <span className="shrink-0">-</span>
                        <span>{cm}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
