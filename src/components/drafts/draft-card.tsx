"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Archive,
  BarChart3,
  Eye,
  Heart,
  MessageSquare,
  Repeat2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ContentSession } from "@/lib/api/types";

interface DraftCardProps {
  session: ContentSession;
  onArchive: (id: string) => void;
  onAddOutcome: (session: ContentSession) => void;
}

const contentTypeLabels: Record<string, string> = {
  linkedin_post: "LinkedIn Post",
  linkedin_article: "LinkedIn Article",
  seo_article: "SEO Article",
};

const statusStyles: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-amber-100 text-amber-700" },
  completed: {
    label: "Published",
    className: "bg-green-100 text-green-700",
  },
  archived: { label: "Archived", className: "bg-gray-100 text-gray-700" },
};

export function DraftCard({ session, onArchive, onAddOutcome }: DraftCardProps) {
  const status = statusStyles[session.status] ?? statusStyles.draft;
  const hasOutcome =
    session.impressions != null ||
    session.likes != null ||
    session.comments != null;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Badge variant="outline" className="text-[10px]">
                {contentTypeLabels[session.content_type] ?? session.content_type}
              </Badge>
              <Badge className={status.className}>{status.label}</Badge>
            </div>
            <p className="text-sm font-medium truncate">
              {session.title || "Untitled Draft"}
            </p>
            {session.final_content && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {session.final_content.slice(0, 200)}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAddOutcome(session)}>
                <BarChart3 className="h-3.5 w-3.5 mr-2" />
                Add Outcome
              </DropdownMenuItem>
              {session.status !== "archived" && (
                <DropdownMenuItem onClick={() => onArchive(session.id)}>
                  <Archive className="h-3.5 w-3.5 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(session.updated_at), {
              addSuffix: true,
            })}
            {session.word_count
              ? ` · ${session.word_count.toLocaleString()} words`
              : ""}
          </span>

          {hasOutcome && (
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              {session.impressions != null && (
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />
                  {session.impressions.toLocaleString()}
                </span>
              )}
              {session.likes != null && (
                <span className="flex items-center gap-0.5">
                  <Heart className="h-3 w-3" />
                  {session.likes.toLocaleString()}
                </span>
              )}
              {session.comments != null && (
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="h-3 w-3" />
                  {session.comments}
                </span>
              )}
              {session.reposts != null && (
                <span className="flex items-center gap-0.5">
                  <Repeat2 className="h-3 w-3" />
                  {session.reposts}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
