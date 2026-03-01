"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Star,
  MoreVertical,
  Eye,
  Mic,
  Crown,
  Trash2,
} from "lucide-react";
import type { AuthorWithBrand } from "@/lib/voice-profiles/types";
import { DNA_SECTIONS } from "@/lib/voice-profiles/constants";
import {
  countItems,
  calculateCompleteness,
  getTotalItemCount,
  getStatusBadge,
} from "@/lib/voice-profiles/utils";

interface ProfileCardProps {
  author: AuthorWithBrand;
  onViewDna: (authorId: string) => void;
  onTrainVoice: (authorId: string) => void;
  onSetPrimary: (authorId: string) => void;
  onDelete: (authorId: string) => void;
}

export function ProfileCard({
  author,
  onViewDna,
  onTrainVoice,
  onSetPrimary,
  onDelete,
}: ProfileCardProps) {
  const authorRecord = author as unknown as Record<string, unknown>;
  const { filled, total, percent } = calculateCompleteness(authorRecord);
  const totalItems = getTotalItemCount(authorRecord);
  const status = getStatusBadge(author.status);

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onViewDna(author.id)}
    >
      <CardContent className="p-5 space-y-3">
        {/* Header: Name + Primary Star + Status Badge */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {author.is_primary && (
                <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
              )}
              <h3 className="font-semibold truncate">{author.name}</h3>
              <Badge
                variant="secondary"
                className={`text-xs shrink-0 ${status.color}`}
              >
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {author.archetype || "General"}
              {author.brand?.name ? ` \u2022 ${author.brand.name}` : ""}
            </p>
          </div>

          {/* Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDna(author.id);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View DNA
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onTrainVoice(author.id);
                }}
              >
                <Mic className="h-4 w-4 mr-2" />
                Train Voice
              </DropdownMenuItem>
              {!author.is_primary && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetPrimary(author.id);
                    }}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Set as Primary
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(author.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* DNA Completeness */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>DNA Completeness</span>
            <span>{percent}%</span>
          </div>
          <Progress value={percent} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {filled}/{total} sections &bull; {totalItems} items
          </p>
        </div>

        {/* Mini-Indicators */}
        <div className="flex flex-wrap gap-1.5">
          {DNA_SECTIONS.map((section) => {
            const count = countItems(authorRecord[section.key]);
            if (count === 0) return null;
            return (
              <Badge
                key={section.key}
                variant="outline"
                className="text-xs font-normal"
              >
                {section.label}
                {section.key !== "tone" && ` ${count}`}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
