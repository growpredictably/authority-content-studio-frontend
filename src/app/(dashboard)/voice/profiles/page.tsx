"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, RefreshCw, Loader2, Check, X, Pencil } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuthor } from "@/hooks/use-author";
import {
  useVoiceProfile,
  useResynthesizeVoice,
  useUpdateDnaSection,
} from "@/lib/api/hooks/use-voice-builder";
import { DnaElementEditor } from "@/components/voice-builder/dna-element-editor";
import { AuthorSelector } from "@/components/shared/author-selector";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────

function renderText(val: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  if (!urlRegex.test(val)) {
    return <p className="text-sm leading-relaxed whitespace-pre-line">{val}</p>;
  }
  const parts = val.split(urlRegex);
  return (
    <p className="text-sm leading-relaxed whitespace-pre-line">
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

function renderVoiceModes(modes: Record<string, unknown>[]): React.ReactNode {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {modes.map((mode, i) => (
        <div key={i} className="rounded-lg border p-3 space-y-1">
          <p className="text-sm font-semibold">{String(mode.mode_name || "")}</p>
          {mode.when_to_use ? (
            <p className="text-xs text-muted-foreground">{String(mode.when_to_use)}</p>
          ) : null}
          {mode.description ? <p className="text-xs">{String(mode.description)}</p> : null}
        </div>
      ))}
    </div>
  );
}

function renderDoList(items: string[], variant: "do" | "dont"): React.ReactNode {
  const Icon = variant === "do" ? Check : X;
  const color = variant === "do" ? "text-green-500" : "text-red-500";
  const labelColor = variant === "do" ? "text-green-600" : "text-red-600";
  return (
    <div className="space-y-1">
      <p className={`text-xs font-bold uppercase ${labelColor}`}>
        {variant === "do" ? "Do" : "Don't"}
      </p>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 text-sm">
          <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function renderJsonSection(val: unknown): React.ReactNode {
  if (!val) return <p className="text-sm text-muted-foreground">Not yet synthesized</p>;

  if (typeof val === "string") {
    return renderText(val);
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return <p className="text-sm text-muted-foreground">None</p>;

    return (
      <div className="space-y-3">
        {val.map((item, idx) => (
          <div key={idx} className="rounded-lg border p-3">
            {typeof item === "string" ? (
              <p className="text-sm">{item}</p>
            ) : typeof item === "object" && item !== null ? (
              <div className="space-y-1">
                {Object.entries(item as Record<string, unknown>).map(([k, v]) => {
                  if (v === null || v === undefined || v === "") return null;
                  const label = k
                    .replace(/[_-]/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <div key={k}>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {label}:{" "}
                      </span>
                      <span className="text-sm">
                        {typeof v === "object" ? JSON.stringify(v) : String(v)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm">{String(item)}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;

    // do/dont pattern (tone section)
    if ("do" in obj || "dont" in obj) {
      const doItems = Array.isArray(obj.do) ? (obj.do as string[]) : [];
      const dontItems = Array.isArray(obj.dont) ? (obj.dont as string[]) : [];
      const rest = Object.entries(obj).filter(
        ([k, v]) => k !== "do" && k !== "dont" && v !== null && v !== undefined && v !== ""
      );
      return (
        <div className="space-y-4">
          {doItems.length > 0 && renderDoList(doItems, "do")}
          {dontItems.length > 0 && renderDoList(dontItems, "dont")}
          {rest.map(([k, v]) => {
            const label = k
              .replace(/[_-]/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
            // voice_modes pattern
            if (k === "voice_modes" && Array.isArray(v)) {
              return (
                <div key={k}>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    {label}
                  </p>
                  {renderVoiceModes(v as Record<string, unknown>[])}
                </div>
              );
            }
            return (
              <div key={k}>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  {label}
                </p>
                {renderJsonSection(v)}
              </div>
            );
          })}
        </div>
      );
    }

    // Generic object
    const entries = Object.entries(obj).filter(
      ([, v]) => v !== null && v !== undefined && v !== ""
    );
    if (entries.length === 0) return <p className="text-sm text-muted-foreground">Not yet synthesized</p>;

    return (
      <div className="space-y-2">
        {entries.map(([k, v]) => {
          const label = k
            .replace(/[_-]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          // voice_modes pattern in any object context
          if (k === "voice_modes" && Array.isArray(v)) {
            return (
              <div key={k}>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  {label}
                </p>
                {renderVoiceModes(v as Record<string, unknown>[])}
              </div>
            );
          }
          return (
            <div key={k}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {label}
              </p>
              {typeof v === "string" ? (
                renderText(v)
              ) : Array.isArray(v) ? (
                <div className="flex flex-wrap gap-1">
                  {v.map((item, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">
                      {typeof item === "string" ? item : JSON.stringify(item)}
                    </Badge>
                  ))}
                </div>
              ) : (
                renderJsonSection(v)
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return <p className="text-sm">{String(val)}</p>;
}

function countItems(val: unknown): number {
  if (Array.isArray(val)) return val.length;
  if (typeof val === "object" && val) return Object.keys(val).length;
  return val ? 1 : 0;
}

// ─── Section Card ────────────────────────────────────────────

function ProfileSection({
  title,
  data,
  onEdit,
  onResynthesize,
  isResynthesizing,
}: {
  title: string;
  data: unknown;
  onEdit?: () => void;
  onResynthesize?: () => void;
  isResynthesizing?: boolean;
}) {
  const count = countItems(data);

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <div className="flex items-center gap-1">
          {count > 0 && (
            <Badge variant="secondary" className="text-xs mr-1">
              {count} {count === 1 ? "item" : "items"}
            </Badge>
          )}
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Edit">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onResynthesize && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onResynthesize}
              disabled={isResynthesizing}
              title="Re-synthesize this section"
            >
              {isResynthesizing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>
      {renderJsonSection(data)}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

const DNA_SECTIONS = [
  { key: "tone", title: "Tone & Style Guide" },
  { key: "stories", title: "Stories" },
  { key: "perspectives", title: "Perspectives" },
  { key: "quotes", title: "Quotes" },
  { key: "knowledge", title: "Knowledge" },
  { key: "experience", title: "Experience" },
  { key: "preferences", title: "Preferences" },
  { key: "frameworks", title: "Frameworks" },
] as const;

const ALL_BRANCHES = [
  "stories", "tone", "perspectives", "internal_knowledge",
  "experience", "quotes", "preferences", "external_knowledge", "frameworks",
];

// Map from DNA_SECTIONS key to synthesis branch name
const SECTION_TO_BRANCH: Record<string, string> = {
  tone: "tone",
  stories: "stories",
  perspectives: "perspectives",
  quotes: "quotes",
  knowledge: "internal_knowledge",
  experience: "experience",
  preferences: "preferences",
  frameworks: "frameworks",
};

export default function VoiceProfilePage() {
  const { author, isLoading: authorLoading } = useAuthor();
  const { data: profile, isLoading: profileLoading } = useVoiceProfile(
    author?.id
  );
  const resynthMutation = useResynthesizeVoice();
  const updateSection = useUpdateDnaSection();

  const [editingSection, setEditingSection] = useState<{
    key: string;
    title: string;
  } | null>(null);
  const [resynthSection, setResynthSection] = useState<string | null>(null);

  const isLoading = authorLoading || profileLoading;

  const profileRecord = profile as Record<string, unknown> | null;
  const filledCount = profileRecord
    ? DNA_SECTIONS.filter(({ key }) => countItems(profileRecord[key]) > 0).length
    : 0;
  const completeness = Math.round((filledCount / DNA_SECTIONS.length) * 100);

  function handleResynthesize() {
    if (!author) return;
    resynthMutation.mutate(
      { author_id: author.id, user_id: author.user_id },
      {
        onSuccess: () =>
          toast.success("Voice re-synthesis started. This may take a minute."),
        onError: (e) => toast.error(`Re-synthesis failed: ${e.message}`),
      }
    );
  }

  function handleSectionResynthesize(sectionKey: string) {
    if (!author) return;
    const branchKey = SECTION_TO_BRANCH[sectionKey] || sectionKey;
    const exclude = ALL_BRANCHES.filter((b) => b !== branchKey);
    setResynthSection(sectionKey);
    resynthMutation.mutate(
      { author_id: author.id, user_id: author.user_id, exclude },
      {
        onSuccess: () => {
          toast.success(`Re-synthesizing ${sectionKey}...`);
          setResynthSection(null);
        },
        onError: (e) => {
          toast.error(`Re-synthesis failed: ${e.message}`);
          setResynthSection(null);
        },
      }
    );
  }

  function handleSaveSection(data: unknown) {
    if (!author || !editingSection) return;
    updateSection.mutate(
      {
        author_id: author.id,
        section_key: editingSection.key,
        data,
      },
      {
        onSuccess: () => {
          toast.success(`${editingSection.title} updated`);
          setEditingSection(null);
        },
        onError: (e) =>
          toast.error(`Save failed: ${e instanceof Error ? e.message : "Unknown error"}`),
      }
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Mic className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Voice Profile</h1>
            <AuthorSelector />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your synthesized voice profile — tone, stories, perspectives, and more
          </p>
          {profile && (
            <div className="mt-2 flex items-center gap-3 max-w-xs">
              <Progress value={completeness} className="h-2" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {completeness}% ({filledCount}/{DNA_SECTIONS.length})
              </span>
            </div>
          )}
        </div>
        {author && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResynthesize}
            disabled={resynthMutation.isPending}
            className="gap-1.5"
          >
            {resynthMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Re-synthesize
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : !profile ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <Mic className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="font-medium">No voice profile found</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Start by adding content through Voice Builder to build your voice
            profile.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {DNA_SECTIONS.map(({ key, title }) => (
            <ProfileSection
              key={key}
              title={title}
              data={profileRecord?.[key]}
              onEdit={() => setEditingSection({ key, title })}
              onResynthesize={() => handleSectionResynthesize(key)}
              isResynthesizing={resynthSection === key}
            />
          ))}
        </div>
      )}

      {editingSection && profileRecord && (
        <DnaElementEditor
          open={!!editingSection}
          onOpenChange={(open) => {
            if (!open) setEditingSection(null);
          }}
          sectionKey={editingSection.key}
          sectionTitle={editingSection.title}
          data={profileRecord[editingSection.key]}
          onSave={handleSaveSection}
          isSaving={updateSection.isPending}
        />
      )}
    </div>
  );
}
