"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";
import type { ContentAngle } from "@/lib/api/types";

interface AngleCardProps {
  angle: ContentAngle;
  isSelected: boolean;
  onSelect: (angle: ContentAngle) => void;
}

export function AngleCard({ angle, isSelected, onSelect }: AngleCardProps) {
  const score = angle.differentiation_score
    ? Math.round(angle.differentiation_score * 100)
    : null;

  return (
    <Card
      className={
        isSelected
          ? "border-primary ring-1 ring-primary"
          : "hover:border-primary/50 transition-colors"
      }
    >
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold leading-snug">
            {angle.angle_title || angle.title}
          </h4>
          {isSelected && (
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          )}
        </div>

        {angle.strategic_brief && (
          <p className="text-xs text-muted-foreground line-clamp-3">
            {angle.strategic_brief}
          </p>
        )}

        {score !== null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Differentiation</span>
              <span className="font-medium">{score}%</span>
            </div>
            <Progress value={score} className="h-1.5" />
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {angle.constraint_type && (
            <Badge variant="outline" className="text-xs">
              {angle.constraint_type}
            </Badge>
          )}
          {angle.content_type && (
            <Badge variant="secondary" className="text-xs">
              {angle.content_type}
            </Badge>
          )}
        </div>

        {angle.hook && (
          <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2">
            {angle.hook}
          </p>
        )}

        <Button
          size="sm"
          variant={isSelected ? "secondary" : "default"}
          onClick={() => onSelect(angle)}
          className="w-full"
        >
          {isSelected ? "Selected" : "Select Angle"}
        </Button>
      </CardContent>
    </Card>
  );
}
