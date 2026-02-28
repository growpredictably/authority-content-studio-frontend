"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Newspaper,
  Search,
  Youtube,
  TrendingUp,
  Sparkles,
  MessageSquare,
  MoreVertical,
  PlayCircle,
  Archive,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { DraftSession } from "@/lib/api/types";

// ─── Config ──────────────────────────────────────────────────

const CONTENT_TYPE_CONFIG: Record<
  string,
  { icon: typeof FileText; color: string; label: string }
> = {
  linkedin_post: {
    icon: MessageSquare,
    color: "border-primary/30 text-primary bg-primary/10",
    label: "LinkedIn Post",
  },
  linkedin_article: {
    icon: Newspaper,
    color:
      "border-blue-500/30 text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
    label: "LinkedIn Article",
  },
  seo_article: {
    icon: Search,
    color:
      "border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950",
    label: "SEO Article",
  },
};

const STRATEGY_CONFIG: Record<
  string,
  { icon: typeof Youtube; label: string; color: string }
> = {
  YouTube: {
    icon: Youtube,
    label: "YouTube",
    color:
      "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
  },
  MarketAnalysis: {
    icon: TrendingUp,
    label: "Market",
    color:
      "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  },
  PostStarter: {
    icon: MessageSquare,
    label: "Starter",
    color:
      "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
  },
};

// ─── Title Helper ─────────────────────────────────────────────

export function getDraftTitle(session: DraftSession): string {
  // 1. Try selected_angle (JSONB object with a .title property)
  if (session.selected_angle) {
    const parsed =
      typeof session.selected_angle === "string"
        ? JSON.parse(session.selected_angle)
        : session.selected_angle;
    if (parsed?.title) return parsed.title;
  }

  // 2. Try the plain title column
  if (session.title) return session.title;

  // 3. Fall back to first angle in all_angles (JSONB array)
  if (session.all_angles) {
    const angles =
      typeof session.all_angles === "string"
        ? JSON.parse(session.all_angles)
        : session.all_angles;
    if (Array.isArray(angles) && angles.length > 0 && angles[0]?.title) {
      return angles[0].title;
    }
  }

  // 4. Last resort
  return "Untitled Draft";
}

// ─── Phase Helpers ───────────────────────────────────────────

export type DraftPhase = "input" | "angles" | "refine" | "outline" | "writing";

export function getPhase(s: DraftSession): DraftPhase {
  // Check current_phase column (both old and new pipeline values)
  if (s.current_phase === "writing" || s.current_phase === "complete" || s.current_phase === "editor")
    return "writing";
  if (s.current_phase === "outline") return "outline";
  if (s.current_phase === "refine" || s.current_phase === "ingredients")
    return "refine";
  if (s.current_phase === "angles") return "angles";
  // Fall back to checking JSONB presence (both old and new columns)
  if (s.written_content || s.final_content || s.full_outline_response)
    return "writing";
  if (s.outline_data || s.outline) return "outline";
  if (s.approved_context) return "refine";
  if (s.selected_angle) return "angles";
  return "input";
}

export function hasMeaningfulProgress(s: DraftSession): boolean {
  // Check current_phase for meaningful values (both old and new pipeline)
  const meaningfulPhases = ["angles", "refine", "ingredients", "outline", "writing", "complete", "editor"];
  if (s.current_phase && meaningfulPhases.includes(s.current_phase))
    return true;
  // Old pipeline: check JSONB columns
  if (s.selected_angle) return true;
  if (s.outline_data) return true;
  if (s.approved_context) return true;
  // New pipeline: check new columns
  if (s.all_angles && (s.all_angles as unknown[])?.length > 0) return true;
  if (s.outline) return true;
  if (s.written_content) return true;
  if (s.final_content) return true;
  return false;
}

function getProgressSteps(s: DraftSession): string[] {
  const phase = getPhase(s);
  const phaseIndex = { input: 0, angles: 1, refine: 2, outline: 3, writing: 4 };
  const idx = phaseIndex[phase] ?? 0;
  const steps: string[] = [];
  if (idx >= 1 || (s.all_angles as unknown[])?.length > 0 || s.selected_angle) steps.push("Angles");
  if (idx >= 2 || s.approved_context) steps.push("Refine");
  if (idx >= 3 || s.outline_data || s.outline) steps.push("Outline");
  if (idx >= 4 || s.written_content || s.final_content) steps.push("Writing");
  return steps;
}

const PHASE_LABELS = ["Angles", "Refine", "Outline", "Writing"];

// ─── Draft Card ──────────────────────────────────────────────

interface DraftCardProps {
  session: DraftSession;
  onArchive: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function DraftCard({ session, onArchive, onDelete }: DraftCardProps) {
  const completedSteps = getProgressSteps(session);
  const fraction = `${completedSteps.length}/4`;

  // Read strategy from old or new column
  const strategy = session.content_strategy || session.strategy;
  const contentType = session.content_type || "linkedin_post";
  const contentConfig =
    CONTENT_TYPE_CONFIG[contentType] ?? CONTENT_TYPE_CONFIG.linkedin_post;
  const strategyConfig = strategy ? STRATEGY_CONFIG[strategy] : null;
  const StrategyIcon = strategyConfig?.icon ?? Sparkles;

  const title = getDraftTitle(session);

  return (
    <div className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow group">
      {/* Top row: strategy icon+label + content type + completion */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            strategyConfig?.color ?? "bg-muted text-muted-foreground"
          )}
        >
          <StrategyIcon className="h-3 w-3" />
          {strategyConfig?.label ?? "Draft"}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            contentConfig.color
          )}
        >
          <contentConfig.icon className="h-3 w-3" />
          {contentConfig.label}
        </span>
        <span className="ml-auto text-[10px] font-semibold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {fraction}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-medium text-sm leading-tight line-clamp-2 mb-2">
        {title}
      </h3>

      {/* Phase pills */}
      <div className="flex gap-1.5 mb-3">
        {PHASE_LABELS.map((label) => {
          const reached = completedSteps.includes(label);
          return (
            <span
              key={label}
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                reached
                  ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {reached && <CheckCircle2 className="h-2.5 w-2.5" />}
              {label}
            </span>
          );
        })}
      </div>

      {/* Bottom row: time + actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(session.updated_at), {
            addSuffix: true,
          })}
          {session.word_count
            ? ` · ${session.word_count.toLocaleString()} words`
            : ""}
        </span>

        <div className="flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
          >
            <Link href={`/content/angles?session=${session.id}`}>
              <PlayCircle className="h-3 w-3" />
              Resume
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onArchive(session.id)}>
                <Archive className="h-3.5 w-3.5 mr-2" />
                Archive
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(session.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
