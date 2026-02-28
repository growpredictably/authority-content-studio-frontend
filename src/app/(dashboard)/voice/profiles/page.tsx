"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, RefreshCw, Loader2 } from "lucide-react";
import { useAuthor } from "@/hooks/use-author";
import {
  useVoiceProfile,
  useResynthesizeVoice,
} from "@/lib/api/hooks/use-voice-builder";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────

function renderJsonSection(val: unknown): React.ReactNode {
  if (!val) return <p className="text-sm text-muted-foreground">Not yet synthesized</p>;

  if (typeof val === "string") {
    return <p className="text-sm leading-relaxed whitespace-pre-line">{val}</p>;
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
    const entries = Object.entries(val as Record<string, unknown>).filter(
      ([, v]) => v !== null && v !== undefined && v !== ""
    );
    if (entries.length === 0) return <p className="text-sm text-muted-foreground">Not yet synthesized</p>;

    return (
      <div className="space-y-2">
        {entries.map(([k, v]) => {
          const label = k
            .replace(/[_-]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          return (
            <div key={k}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {label}
              </p>
              {typeof v === "string" ? (
                <p className="text-sm leading-relaxed whitespace-pre-line">{v}</p>
              ) : Array.isArray(v) ? (
                <div className="flex flex-wrap gap-1">
                  {v.map((item, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">
                      {typeof item === "string" ? item : JSON.stringify(item)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm">{JSON.stringify(v)}</p>
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
}: {
  title: string;
  data: unknown;
}) {
  const count = countItems(data);

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {count > 0 && (
          <Badge variant="secondary" className="text-xs">
            {count} {count === 1 ? "item" : "items"}
          </Badge>
        )}
      </div>
      {renderJsonSection(data)}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

const SECTIONS = [
  { key: "tone", title: "Tone & Style Guide" },
  { key: "stories", title: "Stories" },
  { key: "perspectives", title: "Perspectives" },
  { key: "quotes", title: "Quotes" },
  { key: "knowledge", title: "Knowledge" },
  { key: "experience", title: "Experience" },
  { key: "preferences", title: "Preferences" },
] as const;

export default function VoiceProfilePage() {
  const { author, isLoading: authorLoading } = useAuthor();
  const { data: profile, isLoading: profileLoading } = useVoiceProfile(
    author?.id
  );
  const resynthMutation = useResynthesizeVoice();

  const isLoading = authorLoading || profileLoading;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Mic className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Voice Profile</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your synthesized voice DNA — tone, stories, perspectives, and more
          </p>
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
            Start by adding content through Voice DNA to build your voice
            profile.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {SECTIONS.map(({ key, title }) => (
            <ProfileSection
              key={key}
              title={title}
              data={(profile as Record<string, unknown>)[key]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
