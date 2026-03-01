"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  RefreshCw,
  Loader2,
  Check,
  X,
  Pencil,
  ArrowLeft,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  useVoiceProfile,
  useResynthesizeVoice,
  useUpdateDnaSection,
} from "@/lib/api/hooks/use-voice-builder";
import { DnaElementEditor } from "@/components/voice-builder/dna-element-editor";
import { AuthorityScore } from "@/components/command-center/authority-score";
import { VoiceDnaActionBar } from "@/components/voice-profiles/voice-dna-action-bar";
import { toast } from "sonner";
import { DNA_SECTIONS, ALL_SYNTHESIS_ELEMENTS, SECTION_TO_ELEMENT } from "@/lib/voice-profiles/constants";
import { countItems, calculateCompleteness, getStatusBadge } from "@/lib/voice-profiles/utils";
import { useRealtimeSynthesis } from "@/lib/voice-profiles/use-realtime-synthesis";

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

function renderQuoteItem(item: Record<string, unknown>): React.ReactNode {
  // Prefer refined_quotes[0].quote_text if available
  const refined = item.refined_quotes;
  let displayText = String(item.quote_text || "");
  if (Array.isArray(refined) && refined.length > 0 && refined[0]?.quote_text) {
    displayText = String(refined[0].quote_text);
  }
  return (
    <div className="space-y-1">
      <p className="text-sm italic">&ldquo;{displayText}&rdquo;</p>
      <div className="flex items-center gap-2">
        {item.topic ? (
          <Badge variant="secondary" className="text-xs">{String(item.topic)}</Badge>
        ) : null}
        {item.context ? (
          <span className="text-xs text-muted-foreground">{String(item.context)}</span>
        ) : null}
      </div>
    </div>
  );
}

function renderFrameworkItem(rawItem: Record<string, unknown>): Record<string, unknown> {
  // Unwrap nested framework wrapper if present
  if (
    rawItem.framework &&
    typeof rawItem.framework === "object" &&
    !Array.isArray(rawItem.framework)
  ) {
    return rawItem.framework as Record<string, unknown>;
  }
  return rawItem;
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
        {val.map((rawItem, idx) => {
          if (typeof rawItem === "string") {
            return (
              <div key={idx} className="rounded-lg border p-3">
                <p className="text-sm">{rawItem}</p>
              </div>
            );
          }
          if (typeof rawItem === "object" && rawItem !== null) {
            const obj = rawItem as Record<string, unknown>;
            // Special quote rendering
            if ("quote_text" in obj) {
              return (
                <div key={idx} className="rounded-lg border p-3">
                  {renderQuoteItem(obj)}
                </div>
              );
            }
            // Framework unwrap
            const item = renderFrameworkItem(obj);
            return (
              <div key={idx} className="rounded-lg border p-3">
                <div className="space-y-1">
                  {Object.entries(item).map(([k, v]) => {
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
                          {typeof v === "object"
                            ? Array.isArray(v)
                              ? v.map((sub, si) =>
                                  typeof sub === "object" && sub !== null ? (
                                    <div key={si} className="ml-4 mt-1 rounded border p-2">
                                      {Object.entries(sub as Record<string, unknown>).map(([sk, sv]) => (
                                        <div key={sk}>
                                          <span className="text-xs font-semibold text-muted-foreground">
                                            {sk.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}:{" "}
                                          </span>
                                          <span className="text-sm">{String(sv ?? "")}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <Badge key={si} variant="secondary" className="text-xs font-normal mr-1">
                                      {String(sub)}
                                    </Badge>
                                  )
                                )
                              : JSON.stringify(v)
                            : String(v)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          return (
            <div key={idx} className="rounded-lg border p-3">
              <p className="text-sm">{String(rawItem)}</p>
            </div>
          );
        })}
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
  const [expanded, setExpanded] = useState(false);
  const count = countItems(data);

  return (
    <div className="rounded-xl border bg-card">
      <button
        type="button"
        className="w-full flex items-center justify-between p-5 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
          {count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {count} {count === 1 ? "item" : "items"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onResynthesize && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onResynthesize();
              }}
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
      </button>
      {expanded && <div className="px-5 pb-5">{renderJsonSection(data)}</div>}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function VoiceDnaDetailPage() {
  const params = useParams();
  const authorId = params.authorId as string;

  const { data: profile, isLoading } = useVoiceProfile(authorId);
  const resynthMutation = useResynthesizeVoice();
  const updateSection = useUpdateDnaSection();

  // Live-update DNA sections during synthesis
  useRealtimeSynthesis(authorId);

  const [editingSection, setEditingSection] = useState<{
    key: string;
    title: string;
  } | null>(null);
  const [resynthSection, setResynthSection] = useState<string | null>(null);

  const profileRecord = profile as Record<string, unknown> | null;
  const { filled: filledCount, percent: completeness } = profileRecord
    ? calculateCompleteness(profileRecord)
    : { filled: 0, percent: 0 };

  const status = getStatusBadge(profile?.status as string | undefined);

  function handleSectionResynthesize(sectionKey: string) {
    if (!profile) return;
    const elementKey = SECTION_TO_ELEMENT[sectionKey] || sectionKey;
    const exclude = ALL_SYNTHESIS_ELEMENTS.filter((b) => b !== elementKey);
    setResynthSection(sectionKey);
    resynthMutation.mutate(
      {
        author_id: authorId,
        user_id: profile.user_id as string,
        exclude: [...exclude],
      },
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
    if (!editingSection) return;
    updateSection.mutate(
      {
        author_id: authorId,
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
      {/* Back Navigation */}
      <Link
        href="/voice/profiles"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Voice Profiles
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Mic className="h-6 w-6" />
            <h1 className="text-2xl font-bold">
              {profile?.name ?? "Voice DNA"}
            </h1>
            {profile && (
              <Badge
                variant="secondary"
                className={`text-xs ${status.color}`}
              >
                {status.label}
              </Badge>
            )}
          </div>
          {profile?.archetype && (
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.archetype as string}
              {profile.archetype_description
                ? ` \u2014 ${profile.archetype_description as string}`
                : ""}
            </p>
          )}
          {profile && (
            <div className="mt-2 flex items-center gap-3 max-w-xs">
              <Progress value={completeness} className="h-2" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {completeness}% ({filledCount}/{DNA_SECTIONS.length})
              </span>
            </div>
          )}
        </div>

        {/* Action Bar */}
        {profile && (
          <VoiceDnaActionBar
            authorId={authorId}
            userId={profile.user_id as string}
            authorName={profile.name as string}
            archetype={profile.archetype as string | undefined}
            archetypeDescription={profile.archetype_description as string | undefined}
          />
        )}
      </div>

      {/* Authority Score */}
      <AuthorityScore authorId={authorId} />

      {/* DNA Sections */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : !profile ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <Mic className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="font-medium">No voice profile found</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            This author doesn&apos;t have any DNA data yet. Use Voice Builder to
            train their voice.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {DNA_SECTIONS.map(({ key, label }) => (
            <ProfileSection
              key={key}
              title={label}
              data={profileRecord?.[key]}
              onEdit={() => setEditingSection({ key, title: label })}
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
