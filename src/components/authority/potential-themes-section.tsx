"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
import type { PotentialTheme } from "@/lib/api/types";

interface PotentialThemesSectionProps {
  themes: PotentialTheme[];
}

export function PotentialThemesSection({
  themes,
}: PotentialThemesSectionProps) {
  if (themes.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Potential New Themes</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme, idx) => {
          const readiness =
            typeof theme.readiness === "number"
              ? Math.round(theme.readiness * 100)
              : 0;
          return (
            <Card key={idx}>
              <CardContent className="pt-4 space-y-2.5">
                <h4 className="text-sm font-semibold">{theme.theme}</h4>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Readiness</span>
                    <span className="font-medium tabular-nums">
                      {readiness}%
                    </span>
                  </div>
                  <Progress value={readiness} className="h-1.5" />
                </div>

                {theme.existing_elements &&
                  typeof theme.existing_elements === "object" && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(theme.existing_elements).map(
                        ([key, count]) => (
                          <Badge
                            key={key}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {key}: {count as number}
                          </Badge>
                        )
                      )}
                    </div>
                  )}

                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Blocking:</span>{" "}
                  {theme.blocking_gap}
                </p>

                <p className="text-xs text-muted-foreground">
                  Expected authority strength:{" "}
                  <span className="font-medium tabular-nums">
                    {Math.round(theme.expected_coherence * 100)}%
                  </span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
