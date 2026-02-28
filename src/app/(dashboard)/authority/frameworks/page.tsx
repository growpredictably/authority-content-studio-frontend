"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  User,
  BookOpen,
  Puzzle,
  Lightbulb,
  Target,
  ListChecks,
  Quote,
  Tag,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Headphones,
} from "lucide-react";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import {
  useFrameworks,
  useCreateFramework,
  useUpdateFramework,
  useDeleteFramework,
} from "@/lib/api/hooks/use-frameworks";
import {
  useExtractFramework,
  useEnrichFramework,
} from "@/lib/api/hooks/use-extract-framework";
import { useTranscriptionList } from "@/lib/api/hooks/use-transcriptions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BrandFramework, FrameworkComponent } from "@/lib/api/types";

// ─── Utility ────────────────────────────────────────────────────

function safeComponents(val: unknown): FrameworkComponent[] {
  if (!val) return [];
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* ignore */ }
    return [{ name: val }];
  }
  if (Array.isArray(val)) return val as FrameworkComponent[];
  return [];
}

/** Count populated fields out of the ones that matter */
function fieldCompleteness(fw: BrandFramework): { filled: number; total: number } {
  const components = safeComponents(fw.key_components);
  const total = 7;
  let filled = 0;
  if (fw.purpose_overview) filled++;
  if (fw.unique_benefit) filled++;
  if (components.length > 0) filled++;
  if (fw.applications) filled++;
  if (fw.implementation_guidelines) filled++;
  if (fw.analogies) filled++;
  if (fw.quote) filled++;
  return { filled, total };
}

// ─── Framework Card ─────────────────────────────────────────────

function FrameworkCard({
  fw, isSelected, onClick, onEdit,
}: {
  fw: BrandFramework; isSelected: boolean; onClick: () => void; onEdit: () => void;
}) {
  const components = safeComponents(fw.key_components);
  const name = fw.name || fw.framework_name || "Untitled Framework";
  const { filled, total } = fieldCompleteness(fw);
  const preview = fw.purpose_overview || fw.unique_benefit;

  return (
    <div
      className={cn(
        "group relative w-full text-left rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "bg-card hover:bg-accent/50"
      )}
      onClick={onClick}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-1.5 hover:bg-muted"
        title="Edit framework"
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <h3 className="font-semibold text-sm mb-1 pr-8">{name}</h3>

      {preview && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {preview}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {components.length > 0 && (
            <span className="flex items-center gap-1">
              <Puzzle className="h-3 w-3" />
              {components.length}
            </span>
          )}
          {fw.framework_author && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {fw.framework_author}
            </span>
          )}
        </div>
        <span className={cn(
          "text-[10px] tabular-nums",
          filled === total ? "text-emerald-500" : "text-muted-foreground"
        )}>
          {filled}/{total}
        </span>
      </div>
    </div>
  );
}

// ─── Component Detail Card (expandable) ─────────────────────────

function ComponentCard({ comp, index }: { comp: FrameworkComponent; index: number }) {
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
          {/* Key Points */}
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

          {/* Examples */}
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

          {/* Sub Components */}
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

          {/* Best Practices & Common Mistakes side by side */}
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

// ─── Section helper (only renders if content exists) ────────────

function Section({
  icon: Icon, title, children,
}: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </h3>
      {children}
    </section>
  );
}

// ─── Framework Expanded Detail ──────────────────────────────────

function FrameworkDetail({
  fw, onEdit, onDelete,
}: {
  fw: BrandFramework; onEdit: () => void; onDelete: () => void;
}) {
  const components = safeComponents(fw.key_components);
  const name = fw.name || fw.framework_name || "Untitled Framework";

  return (
    <div className="rounded-xl border bg-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold">{name}</h2>
          {fw.tags_keywords && fw.tags_keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {fw.tags_keywords.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Purpose & Overview */}
      {fw.purpose_overview && (
        <Section icon={BookOpen} title="Purpose & Overview">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {fw.purpose_overview}
          </p>
        </Section>
      )}

      {/* Unique Benefit */}
      {fw.unique_benefit && (
        <Section icon={Sparkles} title="Unique Benefit">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {fw.unique_benefit}
          </p>
        </Section>
      )}

      {/* Key Components */}
      {components.length > 0 && (
        <Section icon={Puzzle} title={`Key Components (${components.length})`}>
          <div className="space-y-2">
            {components.map((comp, idx) => (
              <ComponentCard key={idx} comp={comp} index={idx} />
            ))}
          </div>
        </Section>
      )}

      {/* Applications */}
      {fw.applications && (
        <Section icon={Target} title="Applications">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {fw.applications}
          </p>
        </Section>
      )}

      {/* Implementation Guidelines */}
      {fw.implementation_guidelines && (
        <Section icon={ListChecks} title="Implementation Guidelines">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {fw.implementation_guidelines}
          </p>
        </Section>
      )}

      {/* Analogies */}
      {fw.analogies && (
        <Section icon={Lightbulb} title="Analogies">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line italic">
            {fw.analogies}
          </p>
        </Section>
      )}

      {/* Quote */}
      {fw.quote && (
        <Section icon={Quote} title="Key Quote">
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
        </Section>
      )}

      {/* Further Context */}
      {fw.further_context && (
        <Section icon={BookOpen} title="Further Context">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {fw.further_context}
          </p>
        </Section>
      )}

      <Separator />

      {/* Author & Metadata */}
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
            Created {new Date(fw.created_at).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric",
            })}
          </p>
        )}
      </section>
    </div>
  );
}

// ─── Key Components Editor ─────────────────────────────────────

interface ComponentEntry { name: string; description: string; }

function KeyComponentsEditor({
  components, onChange,
}: {
  components: ComponentEntry[];
  onChange: (c: ComponentEntry[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Key Components</Label>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...components, { name: "", description: "" }])} className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />Add
        </Button>
      </div>
      {components.map((comp, idx) => (
        <div key={idx} className="flex gap-2 items-start">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground font-bold text-[10px] shrink-0 mt-1.5">
            {idx + 1}
          </span>
          <div className="flex-1 space-y-1.5">
            <Input placeholder="Component name" value={comp.name} onChange={(e) => { const u = [...components]; u[idx] = { ...u[idx], name: e.target.value }; onChange(u); }} className="h-8 text-sm" />
            <Input placeholder="Description (optional)" value={comp.description} onChange={(e) => { const u = [...components]; u[idx] = { ...u[idx], description: e.target.value }; onChange(u); }} className="h-8 text-sm" />
          </div>
          <button type="button" onClick={() => onChange(components.filter((_, i) => i !== idx))} className="rounded-md p-1.5 hover:bg-muted mt-0.5">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      ))}
      {components.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No components yet. Click &quot;Add&quot; to define the building blocks.</p>
      )}
    </div>
  );
}

// ─── Framework Form Dialog ──────────────────────────────────────

interface FrameworkFormData {
  name: string;
  purpose_overview: string;
  unique_benefit: string;
  framework_author: string;
  key_components: ComponentEntry[];
  applications: string;
  implementation_guidelines: string;
  analogies: string;
  quote: string;
  quote_author: string;
  further_context: string;
  tags_keywords: string;
}

function parseFormFromFramework(fw?: BrandFramework): FrameworkFormData {
  const rawComps = safeComponents(fw?.key_components);
  const components: ComponentEntry[] = rawComps.map((c) => ({
    name: c.name || "Component",
    description: c.description || "",
  }));
  return {
    name: fw?.name || fw?.framework_name || "",
    purpose_overview: fw?.purpose_overview || "",
    unique_benefit: fw?.unique_benefit || "",
    framework_author: fw?.framework_author || "",
    key_components: components,
    applications: fw?.applications || "",
    implementation_guidelines: fw?.implementation_guidelines || "",
    analogies: fw?.analogies || "",
    quote: fw?.quote || "",
    quote_author: fw?.quote_author || "",
    further_context: fw?.further_context || "",
    tags_keywords: fw?.tags_keywords?.join(", ") || "",
  };
}

function FrameworkFormDialog({
  open, onOpenChange, framework, authorId, userId,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; framework?: BrandFramework; authorId: string; userId: string;
}) {
  const isEdit = !!framework;
  const [form, setForm] = useState<FrameworkFormData>(parseFormFromFramework(framework));
  const createMutation = useCreateFramework();
  const updateMutation = useUpdateFramework();

  // AI generation / enrichment
  const [aiTranscriptId, setAiTranscriptId] = useState("");
  const [aiBatch, setAiBatch] = useState(false);
  const extractFramework = useExtractFramework();
  const enrichFramework = useEnrichFramework();
  const { data: transcripts } = useTranscriptionList(userId);

  const aiPending = extractFramework.isPending || enrichFramework.isPending;
  const isPending = createMutation.isPending || updateMutation.isPending || aiPending;

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Framework name is required"); return; }
    const key_components = form.key_components.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), description: c.description.trim() || undefined }));
    const payload: Record<string, unknown> = { name: form.name.trim() };
    if (form.purpose_overview.trim()) payload.purpose_overview = form.purpose_overview.trim();
    if (form.unique_benefit.trim()) payload.unique_benefit = form.unique_benefit.trim();
    if (form.framework_author.trim()) payload.framework_author = form.framework_author.trim();
    if (key_components.length > 0) payload.key_components = key_components;
    if (form.applications.trim()) payload.applications = form.applications.trim();
    if (form.implementation_guidelines.trim()) payload.implementation_guidelines = form.implementation_guidelines.trim();
    if (form.analogies.trim()) payload.analogies = form.analogies.trim();
    if (form.quote.trim()) payload.quote = form.quote.trim();
    if (form.quote_author.trim()) payload.quote_author = form.quote_author.trim();
    if (form.further_context.trim()) payload.further_context = form.further_context.trim();
    const tags = form.tags_keywords.split(",").map((t) => t.trim()).filter(Boolean);
    if (tags.length > 0) payload.tags_keywords = tags;

    if (isEdit && framework) {
      updateMutation.mutate({ frameworkId: framework.id, ...payload }, {
        onSuccess: () => { toast.success("Framework updated"); onOpenChange(false); },
        onError: (e) => toast.error(`Failed to update: ${e.message}`),
      });
    } else {
      createMutation.mutate({ author_id: authorId, ...payload }, {
        onSuccess: () => { toast.success("Framework created"); onOpenChange(false); setForm(parseFormFromFramework()); },
        onError: (e) => toast.error(`Failed to create: ${e.message}`),
      });
    }
  };

  const handleAiGenerate = () => {
    if (!aiTranscriptId) { toast.error("Select a transcript first"); return; }
    extractFramework.mutate(
      {
        transcriptionId: Number(aiTranscriptId),
        authorId,
        frameworkName: form.name.trim() || undefined,
        useBatch: aiBatch,
      },
      {
        onSuccess: (result) => {
          setAiTranscriptId("");
          onOpenChange(false);
          if ("batch" in result && result.batch) {
            toast.info("Framework generation submitted. Results will be ready within 24 hours.");
          } else {
            toast.success("Framework generated! Click it to review.");
          }
        },
        onError: (e) => toast.error(`Generation failed: ${e.message}`),
      }
    );
  };

  const handleAiEnrich = () => {
    if (!aiTranscriptId || !framework) { toast.error("Select a transcript first"); return; }
    enrichFramework.mutate(
      {
        frameworkId: framework.id,
        transcriptionId: Number(aiTranscriptId),
        authorId,
        useBatch: aiBatch,
      },
      {
        onSuccess: (result) => {
          setAiTranscriptId("");
          onOpenChange(false);
          if ("batch" in result && result.batch) {
            toast.info("Framework enrichment submitted. Results will be ready within 24 hours.");
          } else {
            toast.success("Framework enriched with new insights!");
          }
        },
        onError: (e) => toast.error(`Enrichment failed: ${e.message}`),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!aiPending) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Framework" : "New Framework"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update this framework." : "Define a new signature framework."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* AI Section */}
          {transcripts && transcripts.length > 0 && (
            <>
              <div className="rounded-lg border border-dashed p-4 space-y-3 bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {isEdit ? "Enrich from Transcript" : "Generate from Transcript"}
                </div>
                <div>
                  <Label htmlFor="ai-transcript" className="text-xs text-muted-foreground">
                    Select a Fireflies transcript
                  </Label>
                  <Select
                    value={aiTranscriptId}
                    onValueChange={setAiTranscriptId}
                    disabled={aiPending}
                  >
                    <SelectTrigger id="ai-transcript">
                      <SelectValue placeholder="Choose a transcript..." />
                    </SelectTrigger>
                    <SelectContent>
                      {transcripts.map((tx) => (
                        <SelectItem key={tx.id} value={String(tx.id)}>
                          <span className="flex items-center gap-2">
                            <Headphones className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="truncate">{tx.title}</span>
                            {tx.meeting_date && (
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {new Date(tx.meeting_date).toLocaleDateString()}
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="ai-batch"
                    checked={aiBatch}
                    onCheckedChange={(v) => setAiBatch(v === true)}
                    disabled={aiPending}
                  />
                  <Label htmlFor="ai-batch" className="text-xs font-normal cursor-pointer text-muted-foreground">
                    Use batch processing (50% cheaper, ~24 hours)
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={isEdit ? handleAiEnrich : handleAiGenerate}
                  disabled={!aiTranscriptId || aiPending}
                  className="w-full"
                >
                  {aiPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  {isEdit ? "Enrich with AI" : "Generate with AI"}
                </Button>
              </div>

              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {isEdit ? "or edit manually" : "or fill in manually"}
                </span>
              </div>
            </>
          )}

          {/* Core Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="fw-name">Name *</Label><Input id="fw-name" placeholder="e.g. The Authority Flywheel" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label htmlFor="fw-author">Framework Author</Label><Input id="fw-author" placeholder="Who created this framework?" value={form.framework_author} onChange={(e) => setForm({ ...form, framework_author: e.target.value })} /></div>
          </div>

          <div><Label htmlFor="fw-purpose">Purpose / Overview</Label><Textarea id="fw-purpose" placeholder="What problem does this framework solve?" value={form.purpose_overview} onChange={(e) => setForm({ ...form, purpose_overview: e.target.value })} rows={2} /></div>
          <div><Label htmlFor="fw-benefit">Unique Benefit</Label><Textarea id="fw-benefit" placeholder="What makes this framework uniquely valuable?" value={form.unique_benefit} onChange={(e) => setForm({ ...form, unique_benefit: e.target.value })} rows={2} /></div>

          {/* Components */}
          <KeyComponentsEditor components={form.key_components} onChange={(c) => setForm({ ...form, key_components: c })} />

          {/* Detailed Fields */}
          <Separator />
          <div><Label htmlFor="fw-apps">Applications</Label><Textarea id="fw-apps" placeholder="Where and how is this framework applied?" value={form.applications} onChange={(e) => setForm({ ...form, applications: e.target.value })} rows={2} /></div>
          <div><Label htmlFor="fw-impl">Implementation Guidelines</Label><Textarea id="fw-impl" placeholder="Step-by-step guidance for using this framework" value={form.implementation_guidelines} onChange={(e) => setForm({ ...form, implementation_guidelines: e.target.value })} rows={2} /></div>
          <div><Label htmlFor="fw-analog">Analogies</Label><Textarea id="fw-analog" placeholder="Analogies or metaphors that explain the framework" value={form.analogies} onChange={(e) => setForm({ ...form, analogies: e.target.value })} rows={2} /></div>

          {/* Quote */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="fw-quote">Key Quote</Label><Input id="fw-quote" placeholder="A memorable quote about this framework" value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} /></div>
            <div><Label htmlFor="fw-quote-author">Quote Author</Label><Input id="fw-quote-author" placeholder="Who said it?" value={form.quote_author} onChange={(e) => setForm({ ...form, quote_author: e.target.value })} /></div>
          </div>

          {/* Tags & Context */}
          <div><Label htmlFor="fw-tags">Tags (comma-separated)</Label><Input id="fw-tags" placeholder="e.g. messaging, positioning, clarity" value={form.tags_keywords} onChange={(e) => setForm({ ...form, tags_keywords: e.target.value })} /></div>
          <div><Label htmlFor="fw-context">Further Context</Label><Textarea id="fw-context" placeholder="Additional context, background, or notes" value={form.further_context} onChange={(e) => setForm({ ...form, further_context: e.target.value })} rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Framework"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirmation ────────────────────────────────────────

function DeleteFrameworkDialog({ open, onOpenChange, framework }: { open: boolean; onOpenChange: (v: boolean) => void; framework: BrandFramework }) {
  const deleteMutation = useDeleteFramework();
  const name = framework.name || framework.framework_name || "this framework";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Framework</DialogTitle>
          <DialogDescription>Are you sure you want to delete &quot;{name}&quot;? This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteMutation.isPending}>Cancel</Button>
          <Button variant="destructive" onClick={() => deleteMutation.mutate(framework.id, {
            onSuccess: () => { toast.success(`"${name}" deleted`); onOpenChange(false); },
            onError: (e) => toast.error(`Failed to delete: ${e.message}`),
          })} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function FrameworksPage() {
  const { author, isLoading: authorLoading } = useAuthor();
  const { data, isLoading: fwLoading } = useFrameworks(author?.id);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editFW, setEditFW] = useState<BrandFramework | undefined>();
  const [deleteFW, setDeleteFW] = useState<BrandFramework | undefined>();

  const isLoading = authorLoading || fwLoading;
  const frameworks = data?.frameworks || [];
  const activeFW = frameworks.find((f) => f.id === selectedId) || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Frameworks</h1>
            <AuthorSelector />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your signature thinking models that codify your methodology
          </p>
        </div>
        {author && (
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Framework
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : frameworks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <Layers className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="font-medium">No frameworks yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Create your first signature framework to codify your methodology.
          </p>
          {author && (
            <Button onClick={() => setCreateOpen(true)} variant="outline" size="sm" className="mt-4">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Your First Framework
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {frameworks.map((fw) => (
              <FrameworkCard
                key={fw.id}
                fw={fw}
                isSelected={selectedId === fw.id}
                onClick={() => setSelectedId(selectedId === fw.id ? null : fw.id)}
                onEdit={() => setEditFW(fw)}
              />
            ))}
          </div>

          {activeFW && (
            <FrameworkDetail
              key={activeFW.id}
              fw={activeFW}
              onEdit={() => setEditFW(activeFW)}
              onDelete={() => setDeleteFW(activeFW)}
            />
          )}
        </>
      )}

      {author && <FrameworkFormDialog open={createOpen} onOpenChange={setCreateOpen} authorId={author.id} userId={author.user_id} />}
      {editFW && author && (
        <FrameworkFormDialog key={editFW.id} open={!!editFW} onOpenChange={(v) => !v && setEditFW(undefined)} framework={editFW} authorId={author.id} userId={author.user_id} />
      )}
      {deleteFW && (
        <DeleteFrameworkDialog open={!!deleteFW} onOpenChange={(v) => !v && setDeleteFW(undefined)} framework={deleteFW} />
      )}
    </div>
  );
}
