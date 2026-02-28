"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import {
  useICPs,
  useCreateICP,
  useUpdateICP,
  useDeleteICP,
  useGenerateICP,
} from "@/lib/api/hooks/use-icps";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ICP, ICPPainGain } from "@/lib/api/types";

// ─── Utility ────────────────────────────────────────────────────

function humanize(key: string): string {
  return key
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderVal(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Safely normalize JSONB that might be stored as a raw string */
function safeObject(val: unknown): Record<string, unknown> {
  if (!val) return {};
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Not valid JSON — wrap as a description
    }
    return { description: val };
  }
  if (typeof val === "object" && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }
  return {};
}

const PARAGRAPH_KEYS = new Set([
  "description", "overview", "summary", "interests",
  "profile", "about", "background", "context",
]);

// ─── ICP Card (for the grid) ────────────────────────────────────

function ICPCard({
  icp,
  isSelected,
  onClick,
}: {
  icp: ICP;
  isSelected: boolean;
  onClick: () => void;
}) {
  const demo = safeObject(icp.demographics);
  const pains = (icp.pains_gains || []).filter(
    (pg) => pg.pain_title || pg.pain_description || pg.description
  );
  const gains = (icp.pains_gains || []).filter(
    (pg) => pg.gain_title || pg.gain_description || pg.hope_dream
  );

  // Get structured attributes only (skip paragraphs)
  const demoAttrs = Object.entries(demo).filter(
    ([k, v]) => !PARAGRAPH_KEYS.has(k) && v !== null && v !== undefined && v !== ""
  );

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-all hover:shadow-md",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "bg-card hover:bg-accent/50"
      )}
    >
      <h3 className="font-semibold text-sm mb-1">{icp.name}</h3>

      {demoAttrs.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {demoAttrs.slice(0, 3).map(([k, v]) => (
            <Badge key={k} variant="secondary" className="text-[10px] font-normal">
              {humanize(k)}: {String(v)}
            </Badge>
          ))}
          {demoAttrs.length > 3 && (
            <Badge variant="secondary" className="text-[10px]">
              +{demoAttrs.length - 3}
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-3 text-xs text-muted-foreground">
        {pains.length > 0 && <span>{pains.length} pains</span>}
        {gains.length > 0 && <span>{gains.length} gains</span>}
        {icp.frustrations && <span>Frustrations</span>}
        {icp.aspirations && <span>Aspirations</span>}
      </div>
    </button>
  );
}

// ─── ICP Expanded Detail ────────────────────────────────────────

function ICPDetail({
  icp,
  onEdit,
  onDelete,
}: {
  icp: ICP;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const demo = safeObject(icp.demographics);
  const beforeState = safeObject(icp.before_state);
  const afterState = safeObject(icp.after_state);
  const hasBefore = Object.keys(beforeState).length > 0;
  const hasAfter = Object.keys(afterState).length > 0;

  const pains = (icp.pains_gains || []).filter(
    (pg) => pg.pain_title || pg.pain_description || pg.description
  );
  const gains = (icp.pains_gains || []).filter(
    (pg) => pg.gain_title || pg.gain_description || pg.hope_dream
  );

  const demoParagraphs = Object.entries(demo).filter(([k, v]) => PARAGRAPH_KEYS.has(k) && v);
  const demoAttributes = Object.entries(demo).filter(
    ([k, v]) => !PARAGRAPH_KEYS.has(k) && v !== null && v !== undefined && v !== ""
  );

  return (
    <div className="rounded-xl border bg-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h2 className="text-lg font-bold">{icp.name}</h2>
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

      {/* Demographics */}
      {(demoParagraphs.length > 0 || demoAttributes.length > 0) && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Demographics & Interests
          </h3>
          {demoParagraphs.map(([key, val]) => (
            <p key={key} className="text-sm text-muted-foreground leading-relaxed mb-2">
              {renderVal(val)}
            </p>
          ))}
          {demoAttributes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {demoAttributes.map(([key, val]) => (
                <Badge key={key} variant="outline" className="text-xs font-normal">
                  <span className="font-semibold mr-1">{humanize(key)}:</span>
                  {renderVal(val)}
                </Badge>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Purchase Intel */}
      {(icp.previous_actions || icp.purchase_drivers) && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Purchase Intelligence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {icp.previous_actions && (
              <div className="rounded-lg border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                  Previous Actions
                </h4>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {icp.previous_actions}
                </p>
              </div>
            )}
            {icp.purchase_drivers && (
              <div className="rounded-lg border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                  Purchase Drivers
                </h4>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {icp.purchase_drivers}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Frustrations & Aspirations */}
      {(icp.frustrations || icp.aspirations) && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Emotional Landscape
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {icp.frustrations && (
              <div className="rounded-lg border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                  Frustrations & Fears
                </h4>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {icp.frustrations}
                </p>
              </div>
            )}
            {icp.aspirations && (
              <div className="rounded-lg border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                  Wants & Aspirations
                </h4>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {icp.aspirations}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Transformation */}
      {(hasBefore || hasAfter) && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Transformation Journey
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hasBefore && (
              <div className="rounded-lg border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-3">Before</h4>
                <div className="space-y-2">
                  {Object.entries(beforeState).map(([k, v]) => {
                    const rendered = renderVal(v);
                    if (!rendered) return null;
                    return (
                      <div key={k}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {humanize(k)}
                        </p>
                        <p className="text-sm">{rendered}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {hasAfter && (
              <div className="rounded-lg border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-3">After</h4>
                <div className="space-y-2">
                  {Object.entries(afterState).map(([k, v]) => {
                    const rendered = renderVal(v);
                    if (!rendered) return null;
                    return (
                      <div key={k}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {humanize(k)}
                        </p>
                        <p className="text-sm">{rendered}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Pains */}
      {pains.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Pains ({pains.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pains.map((item, idx) => (
              <div key={item.id || idx} className="rounded-lg border p-3">
                {item.pain_title && (
                  <p className="text-sm font-medium mb-1">{item.pain_title}</p>
                )}
                {(item.pain_description || item.description) && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.pain_description || item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gains */}
      {gains.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Hopes & Gains ({gains.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {gains.map((item, idx) => (
              <div key={item.id || idx} className="rounded-lg border p-3">
                {item.gain_title && (
                  <p className="text-sm font-medium mb-1">{item.gain_title}</p>
                )}
                {(item.gain_description || item.description) && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.gain_description || item.description}
                  </p>
                )}
                {item.hope_dream && (
                  <p className="mt-1.5 text-xs italic text-muted-foreground border-l-2 border-border pl-2">
                    {item.hope_dream}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sales Filters */}
      {icp.sales_filters && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Sales Navigator Filters
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {icp.sales_filters}
          </p>
        </section>
      )}
    </div>
  );
}

// ─── ICP Form Dialog ────────────────────────────────────────────

interface ICPFormData {
  name: string;
  role: string;
  industry: string;
  company_size: string;
  seniority: string;
  description: string;
  frustrations: string;
  aspirations: string;
}

function parseFormFromICP(icp?: ICP): ICPFormData {
  const d = safeObject(icp?.demographics);
  return {
    name: icp?.name || "",
    role: String(d.role || d.title || ""),
    industry: String(d.industry || ""),
    company_size: String(d.company_size || d.companySize || ""),
    seniority: String(d.seniority || d.level || ""),
    description: String(d.description || d.overview || ""),
    frustrations: icp?.frustrations || "",
    aspirations: icp?.aspirations || "",
  };
}

function ICPFormDialog({
  open,
  onOpenChange,
  icp,
  authorId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  icp?: ICP;
  authorId: string;
}) {
  const isEdit = !!icp;
  const [form, setForm] = useState<ICPFormData>(parseFormFromICP(icp));
  const createMutation = useCreateICP();
  const updateMutation = useUpdateICP();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("ICP name is required");
      return;
    }
    const demographics: Record<string, string> = {};
    if (form.role) demographics.role = form.role;
    if (form.industry) demographics.industry = form.industry;
    if (form.company_size) demographics.company_size = form.company_size;
    if (form.seniority) demographics.seniority = form.seniority;
    if (form.description) demographics.description = form.description;
    const payload = {
      name: form.name.trim(),
      demographics,
      frustrations: form.frustrations.trim() || undefined,
      aspirations: form.aspirations.trim() || undefined,
    };
    if (isEdit && icp) {
      updateMutation.mutate(
        { icpId: icp.id, ...payload },
        {
          onSuccess: () => { toast.success("ICP updated"); onOpenChange(false); },
          onError: (e) => toast.error(`Update failed: ${e.message}`),
        }
      );
    } else {
      createMutation.mutate(
        { author_id: authorId, ...payload },
        {
          onSuccess: () => { toast.success("ICP created"); onOpenChange(false); setForm(parseFormFromICP()); },
          onError: (e) => toast.error(`Create failed: ${e.message}`),
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit ICP" : "New ICP"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this Ideal Customer Profile." : "Define a new Ideal Customer Profile."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="icp-name">Name *</Label>
            <Input id="icp-name" placeholder="e.g. Growth-Stage B2B Founders" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="icp-desc">Description</Label>
            <Textarea id="icp-desc" placeholder="Describe this audience segment..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="icp-role">Role / Title</Label>
              <Input id="icp-role" placeholder="e.g. CEO" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="icp-industry">Industry</Label>
              <Input id="icp-industry" placeholder="e.g. SaaS" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="icp-size">Company Size</Label>
              <Input id="icp-size" placeholder="e.g. 50-200" value={form.company_size} onChange={(e) => setForm({ ...form, company_size: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="icp-seniority">Seniority</Label>
              <Input id="icp-seniority" placeholder="e.g. C-Suite" value={form.seniority} onChange={(e) => setForm({ ...form, seniority: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="icp-frustrations">Frustrations</Label>
            <Textarea id="icp-frustrations" placeholder="What keeps them up at night?" value={form.frustrations} onChange={(e) => setForm({ ...form, frustrations: e.target.value })} rows={3} />
          </div>
          <div>
            <Label htmlFor="icp-aspirations">Aspirations</Label>
            <Textarea id="icp-aspirations" placeholder="What do they want to achieve?" value={form.aspirations} onChange={(e) => setForm({ ...form, aspirations: e.target.value })} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {isEdit ? "Save Changes" : "Create ICP"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── AI Generate Dialog ────────────────────────────────────────

function ICPGenerateDialog({
  open, onOpenChange, brandId,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; brandId: string;
}) {
  const generateMutation = useGenerateICP();
  const [targetAudience, setTargetAudience] = useState("");
  const [targetContext, setTargetContext] = useState("");

  function handleGenerate() {
    if (!targetAudience.trim()) {
      toast.error("Target audience is required");
      return;
    }
    generateMutation.mutate(
      {
        target_audience: targetAudience.trim(),
        target_audience_context: targetContext.trim() || undefined,
        brand_id: brandId,
      },
      {
        onSuccess: (res) => {
          if (res.saved) {
            toast.success(`"${res.icp.name}" generated and saved!`);
            handleClose();
          } else {
            toast.error("ICP was generated but could not be saved.");
          }
        },
        onError: (e) => toast.error(`Generation failed: ${e.message}`),
      }
    );
  }

  function handleClose() {
    onOpenChange(false);
    setTargetAudience("");
    setTargetContext("");
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            ICP Generator
          </DialogTitle>
          <DialogDescription>
            Generate and save your Ideal Client Profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="gen-audience">Target Audience</Label>
            <Input
              id="gen-audience"
              placeholder="e.g. B2B SaaS founders scaling to $10M ARR"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              disabled={generateMutation.isPending}
            />
          </div>
          <div>
            <Label htmlFor="gen-context">Target Audience Context</Label>
            <Textarea
              id="gen-context"
              placeholder="Describe your target audience in more detail — their industry, company size, role, challenges..."
              value={targetContext}
              onChange={(e) => setTargetContext(e.target.value)}
              rows={4}
              disabled={generateMutation.isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={generateMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !targetAudience.trim()}
            className="gap-1.5"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generateMutation.isPending ? "Generating..." : "Generate ICP"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirmation ────────────────────────────────────────

function DeleteICPDialog({ open, onOpenChange, icp }: { open: boolean; onOpenChange: (v: boolean) => void; icp: ICP }) {
  const deleteMutation = useDeleteICP();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete ICP</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{icp.name}&quot;? This will remove all associated pains and gains.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteMutation.isPending}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate(icp.id, {
              onSuccess: () => { toast.success(`"${icp.name}" deleted`); onOpenChange(false); },
              onError: (e) => toast.error(`Delete failed: ${e.message}`),
            })}
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

// ─── Main Page ──────────────────────────────────────────────────

export default function ICPsPage() {
  const { author, isLoading: authorLoading } = useAuthor();
  const { data, isLoading: icpsLoading } = useICPs(author?.id);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editICP, setEditICP] = useState<ICP | undefined>();
  const [deleteICP, setDeleteICP] = useState<ICP | undefined>();

  const isLoading = authorLoading || icpsLoading;
  const icps = data?.icps || [];
  const activeICP = icps.find((i) => i.id === selectedId) || null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Target Audience</h1>
            <AuthorSelector />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your ideal customer profiles for targeted content creation
          </p>
        </div>
        {author && (
          <div className="flex items-center gap-2">
            <Button onClick={() => setGenerateOpen(true)} variant="outline" size="sm" className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </Button>
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New ICP
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : icps.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="font-medium">No ICPs defined yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Create your first Ideal Customer Profile to start tailoring content to your audience.
          </p>
          {author && (
            <div className="flex items-center gap-2 mt-4">
              <Button onClick={() => setGenerateOpen(true)} size="sm" className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </Button>
              <Button onClick={() => setCreateOpen(true)} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Create Manually
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Card grid — all ICPs visible */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {icps.map((icp) => (
              <ICPCard
                key={icp.id}
                icp={icp}
                isSelected={selectedId === icp.id}
                onClick={() => setSelectedId(selectedId === icp.id ? null : icp.id)}
              />
            ))}
          </div>

          {/* Expanded detail below the grid */}
          {activeICP && (
            <ICPDetail
              key={activeICP.id}
              icp={activeICP}
              onEdit={() => setEditICP(activeICP)}
              onDelete={() => setDeleteICP(activeICP)}
            />
          )}
        </>
      )}

      {author && <ICPFormDialog open={createOpen} onOpenChange={setCreateOpen} authorId={author.id} />}
      {editICP && author && (
        <ICPFormDialog key={editICP.id} open={!!editICP} onOpenChange={(v) => !v && setEditICP(undefined)} icp={editICP} authorId={author.id} />
      )}
      {deleteICP && (
        <DeleteICPDialog open={!!deleteICP} onOpenChange={(v) => !v && setDeleteICP(undefined)} icp={deleteICP} />
      )}
      {author?.brand_id && (
        <ICPGenerateDialog open={generateOpen} onOpenChange={setGenerateOpen} brandId={author.brand_id} />
      )}
    </div>
  );
}
