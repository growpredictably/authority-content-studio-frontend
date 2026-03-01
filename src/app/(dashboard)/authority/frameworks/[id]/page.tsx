"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  X,
  Plus,
  User,
  BookOpen,
  Puzzle,
  Lightbulb,
  Target,
  ListChecks,
  Quote,
  Tag,
  Sparkles,
  Headphones,
  Search,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useAuthor } from "@/hooks/use-author";
import {
  useFramework,
  useUpdateFramework,
  useDeleteFramework,
} from "@/lib/api/hooks/use-frameworks";
import { useEnrichFramework } from "@/lib/api/hooks/use-extract-framework";
import { useTranscriptionList } from "@/lib/api/hooks/use-transcriptions";
import { ComponentCard } from "@/components/frameworks/component-card";
import { Section } from "@/components/frameworks/section-header";
import {
  ENRICHABLE_FIELD_OPTIONS,
  safeComponents,
  fieldCompleteness,
} from "@/lib/frameworks/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BrandFramework, FrameworkComponent } from "@/lib/api/types";

// ─── Editable Section (generic click-to-edit) ─────────────────

function EditableSection({
  icon,
  title,
  value,
  fieldKey,
  frameworkId,
  multiline = true,
  placeholder,
  italic = false,
}: {
  icon: React.ElementType;
  title: string;
  value: string | undefined;
  fieldKey: string;
  frameworkId: string;
  multiline?: boolean;
  placeholder?: string;
  italic?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const updateMutation = useUpdateFramework();

  useEffect(() => {
    if (!isEditing) setDraft(value || "");
  }, [value, isEditing]);

  const handleSave = () => {
    updateMutation.mutate(
      { frameworkId, [fieldKey]: draft.trim() || null },
      {
        onSuccess: () => {
          toast.success(`${title} updated`);
          setIsEditing(false);
        },
        onError: (e) => toast.error(`Failed to update: ${e.message}`),
      }
    );
  };

  const handleCancel = () => {
    setDraft(value || "");
    setIsEditing(false);
  };

  return (
    <Section icon={icon} title={title}>
      {isEditing ? (
        <div className="space-y-2">
          {multiline ? (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              placeholder={placeholder}
              className="text-sm"
              autoFocus
            />
          ) : (
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              className="text-sm"
              autoFocus
            />
          )}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="group/section relative">
          {value ? (
            <p className={cn(
              "text-sm text-muted-foreground leading-relaxed whitespace-pre-line",
              italic && "italic"
            )}>
              {value}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">
              {placeholder || "Not set"}
            </p>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-0 right-0 opacity-0 group-hover/section:opacity-100 transition-opacity rounded-md p-1.5 hover:bg-muted"
            title={`Edit ${title.toLowerCase()}`}
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
    </Section>
  );
}

// ─── Key Components Section ───────────────────────────────────

interface ComponentEntry { name: string; description: string; }

function KeyComponentsEditor({
  components,
  onChange,
}: {
  components: ComponentEntry[];
  onChange: (c: ComponentEntry[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Components</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange([...components, { name: "", description: "" }])}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />Add
        </Button>
      </div>
      {components.map((comp, idx) => (
        <div key={idx} className="flex gap-2 items-start">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground font-bold text-[10px] shrink-0 mt-1.5">
            {idx + 1}
          </span>
          <div className="flex-1 space-y-1.5">
            <Input
              placeholder="Component name"
              value={comp.name}
              onChange={(e) => {
                const u = [...components];
                u[idx] = { ...u[idx], name: e.target.value };
                onChange(u);
              }}
              className="h-8 text-sm"
            />
            <Input
              placeholder="Description (optional)"
              value={comp.description}
              onChange={(e) => {
                const u = [...components];
                u[idx] = { ...u[idx], description: e.target.value };
                onChange(u);
              }}
              className="h-8 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(components.filter((_, i) => i !== idx))}
            className="rounded-md p-1.5 hover:bg-muted mt-0.5"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      ))}
      {components.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          No components yet. Click &quot;Add&quot; to define the building blocks.
        </p>
      )}
    </div>
  );
}

function KeyComponentsSection({
  fw,
  frameworkId,
}: {
  fw: BrandFramework;
  frameworkId: string;
}) {
  const components = safeComponents(fw.key_components);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ComponentEntry[]>(
    components.map((c) => ({ name: c.name || "", description: c.description || "" }))
  );
  const updateMutation = useUpdateFramework();

  useEffect(() => {
    if (!isEditing) {
      const comps = safeComponents(fw.key_components);
      setDraft(comps.map((c) => ({ name: c.name || "", description: c.description || "" })));
    }
  }, [fw.key_components, isEditing]);

  const handleSave = () => {
    const cleaned = draft
      .filter((c) => c.name.trim())
      .map((c) => ({ name: c.name.trim(), description: c.description.trim() || undefined }));
    updateMutation.mutate(
      { frameworkId, key_components: cleaned },
      {
        onSuccess: () => {
          toast.success("Key components updated");
          setIsEditing(false);
        },
        onError: (e) => toast.error(`Failed to update: ${e.message}`),
      }
    );
  };

  return (
    <Section icon={Puzzle} title={`Key Components (${components.length})`}>
      {isEditing ? (
        <div className="space-y-3">
          <KeyComponentsEditor components={draft} onChange={setDraft} />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={updateMutation.isPending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="group/section relative">
          {components.length > 0 ? (
            <div className="space-y-2">
              {components.map((comp, idx) => (
                <ComponentCard key={idx} comp={comp} index={idx} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">No components defined yet.</p>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-0 right-0 opacity-0 group-hover/section:opacity-100 transition-opacity rounded-md p-1.5 hover:bg-muted"
            title="Edit key components"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
    </Section>
  );
}

// ─── Quote Section ────────────────────────────────────────────

function QuoteSection({
  fw,
  frameworkId,
}: {
  fw: BrandFramework;
  frameworkId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftQuote, setDraftQuote] = useState(fw.quote || "");
  const [draftAuthor, setDraftAuthor] = useState(fw.quote_author || "");
  const updateMutation = useUpdateFramework();

  useEffect(() => {
    if (!isEditing) {
      setDraftQuote(fw.quote || "");
      setDraftAuthor(fw.quote_author || "");
    }
  }, [fw.quote, fw.quote_author, isEditing]);

  const handleSave = () => {
    updateMutation.mutate(
      { frameworkId, quote: draftQuote.trim() || null, quote_author: draftAuthor.trim() || null },
      {
        onSuccess: () => {
          toast.success("Quote updated");
          setIsEditing(false);
        },
        onError: (e) => toast.error(`Failed to update: ${e.message}`),
      }
    );
  };

  return (
    <Section icon={Quote} title="Key Quote">
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={draftQuote}
            onChange={(e) => setDraftQuote(e.target.value)}
            placeholder="A memorable quote about this framework"
            rows={2}
            className="text-sm"
            autoFocus
          />
          <Input
            value={draftAuthor}
            onChange={(e) => setDraftAuthor(e.target.value)}
            placeholder="Who said it?"
            className="text-sm"
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={updateMutation.isPending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="group/section relative">
          {fw.quote ? (
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium leading-relaxed italic">
                &ldquo;{fw.quote}&rdquo;
              </p>
              {fw.quote_author && (
                <p className="text-xs text-muted-foreground mt-2">
                  &mdash; {fw.quote_author}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">No quote set.</p>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-0 right-0 opacity-0 group-hover/section:opacity-100 transition-opacity rounded-md p-1.5 hover:bg-muted"
            title="Edit quote"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
    </Section>
  );
}

// ─── Tags Section ─────────────────────────────────────────────

function TagsSection({
  fw,
  frameworkId,
}: {
  fw: BrandFramework;
  frameworkId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(fw.tags_keywords?.join(", ") || "");
  const updateMutation = useUpdateFramework();

  useEffect(() => {
    if (!isEditing) setDraft(fw.tags_keywords?.join(", ") || "");
  }, [fw.tags_keywords, isEditing]);

  const handleSave = () => {
    const tags = draft.split(",").map((t) => t.trim()).filter(Boolean);
    updateMutation.mutate(
      { frameworkId, tags_keywords: tags.length > 0 ? tags : null },
      {
        onSuccess: () => {
          toast.success("Tags updated");
          setIsEditing(false);
        },
        onError: (e) => toast.error(`Failed to update: ${e.message}`),
      }
    );
  };

  return (
    <Section icon={Tag} title="Tags">
      {isEditing ? (
        <div className="space-y-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. messaging, positioning, clarity"
            className="text-sm"
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground">Comma-separated keywords</p>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={updateMutation.isPending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="group/section relative">
          {fw.tags_keywords && fw.tags_keywords.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {fw.tags_keywords.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">No tags set.</p>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-0 right-0 opacity-0 group-hover/section:opacity-100 transition-opacity rounded-md p-1.5 hover:bg-muted"
            title="Edit tags"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
    </Section>
  );
}

// ─── Enrichment Panel ─────────────────────────────────────────

function EnrichmentPanel({
  fw,
  authorId,
  userId,
}: {
  fw: BrandFramework;
  authorId: string;
  userId: string;
}) {
  const { data: transcripts } = useTranscriptionList(userId);
  const enrichFramework = useEnrichFramework();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiBatch, setAiBatch] = useState(false);
  const [fieldsToEnhance, setFieldsToEnhance] = useState<Set<string>>(
    new Set(ENRICHABLE_FIELD_OPTIONS.map((f) => f.key))
  );

  const toggleField = (key: string) => {
    setFieldsToEnhance((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allFieldsSelected = fieldsToEnhance.size === ENRICHABLE_FIELD_OPTIONS.length;
  const toggleAllFields = () => {
    if (allFieldsSelected) setFieldsToEnhance(new Set());
    else setFieldsToEnhance(new Set(ENRICHABLE_FIELD_OPTIONS.map((f) => f.key)));
  };

  const toggleTranscript = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) {
        toast.error("Maximum 5 transcripts");
        return prev;
      }
      const next = [...prev, id];
      if (next.length > 1) setAiBatch(false);
      return next;
    });
  };

  const filteredTranscripts = transcripts?.filter((tx) =>
    !searchQuery ||
    tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tx.meeting_date && tx.meeting_date.includes(searchQuery))
  );

  const handleEnrich = () => {
    if (selectedIds.length === 0) { toast.error("Select at least one transcript"); return; }
    if (fieldsToEnhance.size === 0) { toast.error("Select at least one field to enhance"); return; }
    const selectedFields = allFieldsSelected ? undefined : Array.from(fieldsToEnhance);
    const count = selectedIds.length;

    if (count > 1) {
      toast.info(`Synthesizing and enriching from ${count} transcripts... This may take a minute.`);
    }

    enrichFramework.mutate(
      {
        frameworkId: fw.id,
        transcriptionIds: selectedIds,
        authorId,
        useBatch: aiBatch,
        fieldsToEnhance: selectedFields,
      },
      {
        onSuccess: (result) => {
          setSelectedIds([]);
          if ("batch" in result && result.batch) {
            toast.info("Framework enrichment submitted. Results will be ready within 24 hours.");
          } else {
            toast.success(
              count > 1
                ? `Framework enriched from ${count} transcripts!`
                : "Framework enriched with new insights!"
            );
          }
        },
        onError: (e) => toast.error(`Enrichment failed: ${e.message}`),
      }
    );
  };

  // Enrichment history: cross-reference source_transcription_ids with transcript list
  const enrichedTranscripts = (fw.source_transcription_ids || [])
    .map((id) => transcripts?.find((tx) => tx.id === id))
    .filter(Boolean);

  if (!transcripts || transcripts.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Enrichment
        </h3>
        <p className="text-sm text-muted-foreground">
          No transcripts available. Sync your Fireflies transcripts to enrich this framework with AI.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-5">
      <h3 className="flex items-center gap-2 font-semibold text-sm">
        <Sparkles className="h-4 w-4 text-primary" />
        AI Enrichment
      </h3>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search transcripts..."
          className="pl-8 h-8 text-sm"
        />
      </div>

      {/* Transcript checklist */}
      <div className="overflow-y-auto max-h-[300px] space-y-1 border rounded-lg p-2">
        {filteredTranscripts?.map((tx) => {
          const isSelected = selectedIds.includes(tx.id);
          return (
            <label
              key={tx.id}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 cursor-pointer transition-colors text-sm",
                isSelected ? "bg-primary/5" : "hover:bg-accent/50"
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleTranscript(tx.id)}
                disabled={enrichFramework.isPending}
              />
              <Headphones className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate flex-1 text-sm">{tx.title}</span>
              {tx.meeting_date && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(tx.meeting_date).toLocaleDateString()}
                </span>
              )}
            </label>
          );
        })}
        {filteredTranscripts?.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No transcripts match.</p>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {selectedIds.length} / 5 max selected
      </p>

      {/* Fields to enhance */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Fields to enhance</Label>
          <button
            type="button"
            onClick={toggleAllFields}
            className="text-[10px] text-primary hover:underline"
          >
            {allFieldsSelected ? "Deselect all" : "Select all"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {ENRICHABLE_FIELD_OPTIONS.map((field) => (
            <div key={field.key} className="flex items-center gap-2">
              <Checkbox
                id={`enrich-detail-${field.key}`}
                checked={fieldsToEnhance.has(field.key)}
                onCheckedChange={() => toggleField(field.key)}
                disabled={enrichFramework.isPending}
              />
              <Label
                htmlFor={`enrich-detail-${field.key}`}
                className="text-xs font-normal cursor-pointer text-muted-foreground"
                title={field.description}
              >
                {field.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Batch toggle */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="detail-ai-batch"
          checked={aiBatch}
          onCheckedChange={(v) => setAiBatch(v === true)}
          disabled={enrichFramework.isPending || selectedIds.length > 1}
        />
        <Label htmlFor="detail-ai-batch" className="text-xs font-normal cursor-pointer text-muted-foreground">
          Batch (50% cheaper, ~24h)
          {selectedIds.length > 1 && (
            <span className="text-[10px] text-muted-foreground/60 ml-1">(single transcript only)</span>
          )}
        </Label>
      </div>

      {/* Enrich button */}
      <Button
        onClick={handleEnrich}
        disabled={selectedIds.length === 0 || enrichFramework.isPending || fieldsToEnhance.size === 0}
        className="w-full"
        size="sm"
      >
        {enrichFramework.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
        <Sparkles className="h-4 w-4 mr-1.5" />
        {selectedIds.length > 1
          ? `Enrich from ${selectedIds.length} Transcripts`
          : "Enrich with AI"}
      </Button>

      {/* Enrichment History */}
      {enrichedTranscripts.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Enrichment History
            </h4>
            <div className="space-y-1">
              {enrichedTranscripts.map((tx) => tx && (
                <div key={tx.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Headphones className="h-3 w-3 shrink-0" />
                  <span className="truncate">{tx.title}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────

function DeleteFrameworkDialog({
  open,
  onOpenChange,
  framework,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  framework: BrandFramework;
  onDeleted: () => void;
}) {
  const deleteMutation = useDeleteFramework();
  const name = framework.name || framework.framework_name || "this framework";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Framework</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{name}&quot;? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              deleteMutation.mutate(framework.id, {
                onSuccess: () => {
                  toast.success(`"${name}" deleted`);
                  onOpenChange(false);
                  onDeleted();
                },
                onError: (e) => toast.error(`Failed to delete: ${e.message}`),
              })
            }
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Detail Page ─────────────────────────────────────────

export default function FrameworkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const frameworkId = params.id as string;

  const { author, isLoading: authorLoading } = useAuthor();
  const { data: fw, isLoading: fwLoading } = useFramework(frameworkId);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isLoading = authorLoading || fwLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!fw) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold mb-2">Framework not found</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This framework may have been deleted or the link is invalid.
        </p>
        <Button variant="outline" asChild>
          <Link href="/authority/frameworks">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Frameworks
          </Link>
        </Button>
      </div>
    );
  }

  const name = fw.name || fw.framework_name || "Untitled Framework";
  const { filled, total } = fieldCompleteness(fw);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link href="/authority/frameworks">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Frameworks
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-xl font-bold truncate">{name}</h1>
          <Badge
            variant={filled === total ? "default" : "secondary"}
            className={cn("text-[10px] shrink-0", filled === total && "bg-emerald-500")}
          >
            {filled}/{total}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          className="text-destructive shrink-0"
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Delete
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left column: editable content */}
        <div className="space-y-6">
          <EditableSection
            icon={BookOpen}
            title="Purpose & Overview"
            value={fw.purpose_overview}
            fieldKey="purpose_overview"
            frameworkId={frameworkId}
            placeholder="What problem does this framework solve?"
          />

          <EditableSection
            icon={Sparkles}
            title="Unique Benefit"
            value={fw.unique_benefit}
            fieldKey="unique_benefit"
            frameworkId={frameworkId}
            placeholder="What makes this framework uniquely valuable?"
          />

          <KeyComponentsSection fw={fw} frameworkId={frameworkId} />

          <EditableSection
            icon={Target}
            title="Applications"
            value={fw.applications}
            fieldKey="applications"
            frameworkId={frameworkId}
            placeholder="Where and how is this framework applied?"
          />

          <EditableSection
            icon={ListChecks}
            title="Implementation Guidelines"
            value={fw.implementation_guidelines}
            fieldKey="implementation_guidelines"
            frameworkId={frameworkId}
            placeholder="Step-by-step guidance for using this framework"
          />

          <EditableSection
            icon={Lightbulb}
            title="Analogies"
            value={fw.analogies}
            fieldKey="analogies"
            frameworkId={frameworkId}
            placeholder="Analogies or metaphors that explain the framework"
            italic
          />

          <QuoteSection fw={fw} frameworkId={frameworkId} />

          <EditableSection
            icon={BookOpen}
            title="Further Context & Connections"
            value={fw.further_context}
            fieldKey="further_context"
            frameworkId={frameworkId}
            placeholder="Intellectual connections, supplementary theory, origin story, and practical nuances"
          />

          <TagsSection fw={fw} frameworkId={frameworkId} />

          {/* Author & Metadata footer */}
          <Separator />
          <section className="flex items-center justify-between">
            {fw.framework_author && (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Framework Author
                  </p>
                  <p className="text-sm font-medium">{fw.framework_author}</p>
                </div>
              </div>
            )}
            {fw.created_at && (
              <p className="text-xs text-muted-foreground">
                Created{" "}
                {new Date(fw.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </section>
        </div>

        {/* Right column: AI enrichment panel (sticky) */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          {author && (
            <EnrichmentPanel
              fw={fw}
              authorId={author.id}
              userId={author.user_id}
            />
          )}
        </div>
      </div>

      {/* Delete dialog */}
      {deleteOpen && fw && (
        <DeleteFrameworkDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          framework={fw}
          onDeleted={() => router.push("/authority/frameworks")}
        />
      )}
    </div>
  );
}
