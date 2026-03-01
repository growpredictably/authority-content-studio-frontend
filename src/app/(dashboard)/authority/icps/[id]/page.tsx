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
  Users,
  ShoppingBag,
  Heart,
  ArrowRightLeft,
  AlertTriangle,
  Star,
  Filter,
  Sparkles,
  BarChart3,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuthor } from "@/hooks/use-author";
import {
  useICPDetail,
  useUpdateICP,
  useDeleteICP,
  useGenerateICP,
} from "@/lib/api/hooks/use-icps";
import { Section } from "@/components/frameworks/section-header";
import {
  humanize,
  renderVal,
  safeObject,
  PARAGRAPH_KEYS,
  icpCompleteness,
} from "@/lib/icps/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ICP, ICPPainGain } from "@/lib/api/types";

// ─── Editable Text Section (click-to-edit) ────────────────────

function EditableTextSection({
  icon,
  title,
  value,
  fieldKey,
  icpId,
  multiline = true,
  placeholder,
}: {
  icon: React.ElementType;
  title: string;
  value: string | undefined;
  fieldKey: string;
  icpId: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const updateMutation = useUpdateICP();

  useEffect(() => {
    if (!isEditing) setDraft(value || "");
  }, [value, isEditing]);

  const handleSave = () => {
    updateMutation.mutate(
      { icpId, [fieldKey]: draft.trim() || null },
      {
        onSuccess: () => {
          toast.success(`${title} updated`);
          setIsEditing(false);
        },
        onError: (e) => toast.error(`Failed to update: ${e.message}`),
      }
    );
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
          {value ? (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
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

// ─── Two-Column Text Section ──────────────────────────────────

function TwoColumnTextSection({
  icon,
  title,
  leftTitle,
  leftValue,
  leftFieldKey,
  leftPlaceholder,
  rightTitle,
  rightValue,
  rightFieldKey,
  rightPlaceholder,
  icpId,
}: {
  icon: React.ElementType;
  title: string;
  leftTitle: string;
  leftValue: string | undefined;
  leftFieldKey: string;
  leftPlaceholder: string;
  rightTitle: string;
  rightValue: string | undefined;
  rightFieldKey: string;
  rightPlaceholder: string;
  icpId: string;
}) {
  const [editingLeft, setEditingLeft] = useState(false);
  const [editingRight, setEditingRight] = useState(false);
  const [draftLeft, setDraftLeft] = useState(leftValue || "");
  const [draftRight, setDraftRight] = useState(rightValue || "");
  const updateMutation = useUpdateICP();

  useEffect(() => {
    if (!editingLeft) setDraftLeft(leftValue || "");
  }, [leftValue, editingLeft]);

  useEffect(() => {
    if (!editingRight) setDraftRight(rightValue || "");
  }, [rightValue, editingRight]);

  const saveField = (side: "left" | "right") => {
    const fieldKey = side === "left" ? leftFieldKey : rightFieldKey;
    const draft = side === "left" ? draftLeft : draftRight;
    const setEditing = side === "left" ? setEditingLeft : setEditingRight;
    const fieldTitle = side === "left" ? leftTitle : rightTitle;

    updateMutation.mutate(
      { icpId, [fieldKey]: draft.trim() || null },
      {
        onSuccess: () => {
          toast.success(`${fieldTitle} updated`);
          setEditing(false);
        },
        onError: (e) => toast.error(`Failed to update: ${e.message}`),
      }
    );
  };

  const renderSide = (
    sideTitle: string,
    sideValue: string | undefined,
    sideDraft: string,
    setSideDraft: (v: string) => void,
    isEditing: boolean,
    setEditing: (v: boolean) => void,
    side: "left" | "right",
    sidePlaceholder: string
  ) => (
    <div className="rounded-lg border p-4">
      <div className="group/side relative">
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">{sideTitle}</h4>
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={sideDraft}
              onChange={(e) => setSideDraft(e.target.value)}
              rows={4}
              placeholder={sidePlaceholder}
              className="text-sm"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => saveField(side)} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={updateMutation.isPending}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {sideValue ? (
              <p className="text-sm leading-relaxed whitespace-pre-line">{sideValue}</p>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">{sidePlaceholder}</p>
            )}
            <button
              onClick={() => setEditing(true)}
              className="absolute top-0 right-0 opacity-0 group-hover/side:opacity-100 transition-opacity rounded-md p-1.5 hover:bg-muted"
              title={`Edit ${sideTitle.toLowerCase()}`}
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <Section icon={icon} title={title}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderSide(leftTitle, leftValue, draftLeft, setDraftLeft, editingLeft, setEditingLeft, "left", leftPlaceholder)}
        {renderSide(rightTitle, rightValue, draftRight, setDraftRight, editingRight, setEditingRight, "right", rightPlaceholder)}
      </div>
    </Section>
  );
}

// ─── Demographics Section (JSONB key-value editor) ────────────

function DemographicsSection({
  icp,
  icpId,
}: {
  icp: ICP;
  icpId: string;
}) {
  const demo = safeObject(icp.demographics);
  const demoParagraphs = Object.entries(demo).filter(([k, v]) => PARAGRAPH_KEYS.has(k) && v);
  const demoAttributes = Object.entries(demo).filter(
    ([k, v]) => !PARAGRAPH_KEYS.has(k) && v !== null && v !== undefined && v !== ""
  );

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<{ key: string; value: string }[]>([]);
  const updateMutation = useUpdateICP();

  useEffect(() => {
    if (!isEditing) {
      const d = safeObject(icp.demographics);
      setDraft(
        Object.entries(d).map(([key, val]) => ({
          key,
          value: renderVal(val),
        }))
      );
    }
  }, [icp.demographics, isEditing]);

  const handleSave = () => {
    const demographics: Record<string, string> = {};
    for (const entry of draft) {
      if (entry.key.trim() && entry.value.trim()) {
        demographics[entry.key.trim()] = entry.value.trim();
      }
    }
    updateMutation.mutate(
      { icpId, demographics: Object.keys(demographics).length > 0 ? demographics : null },
      {
        onSuccess: () => {
          toast.success("Demographics updated");
          setIsEditing(false);
        },
        onError: (e) => toast.error(`Failed to update: ${e.message}`),
      }
    );
  };

  const addEntry = () => setDraft([...draft, { key: "", value: "" }]);
  const removeEntry = (idx: number) => setDraft(draft.filter((_, i) => i !== idx));
  const updateEntry = (idx: number, field: "key" | "value", val: string) => {
    const u = [...draft];
    u[idx] = { ...u[idx], [field]: val };
    setDraft(u);
  };

  return (
    <Section icon={UserCircle} title="Demographics & Interests">
      {isEditing ? (
        <div className="space-y-3">
          {draft.map((entry, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <Input
                value={entry.key}
                onChange={(e) => updateEntry(idx, "key", e.target.value)}
                placeholder="Field name (e.g. role)"
                className="h-8 text-sm w-36 shrink-0"
              />
              <Input
                value={entry.value}
                onChange={(e) => updateEntry(idx, "value", e.target.value)}
                placeholder="Value"
                className="h-8 text-sm flex-1"
              />
              <button
                onClick={() => removeEntry(idx)}
                className="rounded-md p-1.5 hover:bg-muted mt-0.5 shrink-0"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={addEntry} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />Add Field
          </Button>
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
          {demoParagraphs.length === 0 && demoAttributes.length === 0 ? (
            <p className="text-sm text-muted-foreground/50 italic">No demographics set.</p>
          ) : (
            <>
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
            </>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-0 right-0 opacity-0 group-hover/section:opacity-100 transition-opacity rounded-md p-1.5 hover:bg-muted"
            title="Edit demographics"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
    </Section>
  );
}

// ─── Transformation Section (before/after state editor) ───────

function TransformationSection({
  icp,
  icpId,
}: {
  icp: ICP;
  icpId: string;
}) {
  const beforeState = safeObject(icp.before_state);
  const afterState = safeObject(icp.after_state);
  const hasBefore = Object.keys(beforeState).length > 0;
  const hasAfter = Object.keys(afterState).length > 0;

  const [isEditing, setIsEditing] = useState(false);
  const [draftBefore, setDraftBefore] = useState<{ key: string; value: string }[]>([]);
  const [draftAfter, setDraftAfter] = useState<{ key: string; value: string }[]>([]);
  const updateMutation = useUpdateICP();

  useEffect(() => {
    if (!isEditing) {
      setDraftBefore(Object.entries(safeObject(icp.before_state)).map(([k, v]) => ({ key: k, value: renderVal(v) })));
      setDraftAfter(Object.entries(safeObject(icp.after_state)).map(([k, v]) => ({ key: k, value: renderVal(v) })));
    }
  }, [icp.before_state, icp.after_state, isEditing]);

  const handleSave = () => {
    const before: Record<string, string> = {};
    for (const e of draftBefore) { if (e.key.trim() && e.value.trim()) before[e.key.trim()] = e.value.trim(); }
    const after: Record<string, string> = {};
    for (const e of draftAfter) { if (e.key.trim() && e.value.trim()) after[e.key.trim()] = e.value.trim(); }

    updateMutation.mutate(
      {
        icpId,
        before_state: Object.keys(before).length > 0 ? before : null,
        after_state: Object.keys(after).length > 0 ? after : null,
      },
      {
        onSuccess: () => {
          toast.success("Transformation updated");
          setIsEditing(false);
        },
        onError: (e) => toast.error(`Failed to update: ${e.message}`),
      }
    );
  };

  const renderKVEditor = (
    entries: { key: string; value: string }[],
    setEntries: (v: { key: string; value: string }[]) => void,
    label: string
  ) => (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      {entries.map((entry, idx) => (
        <div key={idx} className="flex gap-2 items-start">
          <Input
            value={entry.key}
            onChange={(e) => {
              const u = [...entries]; u[idx] = { ...u[idx], key: e.target.value }; setEntries(u);
            }}
            placeholder="Key (e.g. have)"
            className="h-8 text-sm w-28 shrink-0"
          />
          <Input
            value={entry.value}
            onChange={(e) => {
              const u = [...entries]; u[idx] = { ...u[idx], value: e.target.value }; setEntries(u);
            }}
            placeholder="Value"
            className="h-8 text-sm flex-1"
          />
          <button onClick={() => setEntries(entries.filter((_, i) => i !== idx))} className="rounded-md p-1.5 hover:bg-muted mt-0.5 shrink-0">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={() => setEntries([...entries, { key: "", value: "" }])} className="h-7 text-xs">
        <Plus className="h-3 w-3 mr-1" />Add
      </Button>
    </div>
  );

  const renderStateView = (
    state: Record<string, unknown>,
    label: string
  ) => (
    <div className="rounded-lg border p-4">
      <h4 className="text-xs font-semibold text-muted-foreground mb-3">{label}</h4>
      <div className="space-y-2">
        {Object.entries(state).map(([k, v]) => {
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
  );

  return (
    <Section icon={ArrowRightLeft} title="Transformation Journey">
      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderKVEditor(draftBefore, setDraftBefore, "Before State")}
            {renderKVEditor(draftAfter, setDraftAfter, "After State")}
          </div>
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
          {!hasBefore && !hasAfter ? (
            <p className="text-sm text-muted-foreground/50 italic">No transformation journey defined.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hasBefore && renderStateView(beforeState, "Before")}
              {hasAfter && renderStateView(afterState, "After")}
            </div>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-0 right-0 opacity-0 group-hover/section:opacity-100 transition-opacity rounded-md p-1.5 hover:bg-muted"
            title="Edit transformation"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
    </Section>
  );
}

// ─── Regeneration Panel (right column) ────────────────────────

function RegenerationPanel({
  icp,
  brandId,
}: {
  icp: ICP;
  brandId: string;
}) {
  const router = useRouter();
  const generateMutation = useGenerateICP();
  const [targetAudience, setTargetAudience] = useState("");
  const [targetContext, setTargetContext] = useState("");

  const pains = (icp.pains_gains || []).filter(
    (pg) => pg.pain_title || pg.pain_description || pg.description
  );
  const gains = (icp.pains_gains || []).filter(
    (pg) => pg.gain_title || pg.gain_description || pg.hope_dream
  );
  const { filled, total } = icpCompleteness(icp);

  const handleRegenerate = () => {
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
            toast.success(`"${res.icp.name}" generated!`);
            setTargetAudience("");
            setTargetContext("");
            router.push(`/authority/icps/${res.icp.id}`);
          } else {
            toast.error("ICP was generated but could not be saved.");
          }
        },
        onError: (e) => toast.error(`Generation failed: ${e.message}`),
      }
    );
  };

  return (
    <div className="rounded-xl border bg-card p-6 space-y-5">
      <h3 className="flex items-center gap-2 font-semibold text-sm">
        <Sparkles className="h-4 w-4 text-primary" />
        AI Generation
      </h3>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Target Audience</Label>
          <Input
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g. B2B SaaS founders scaling to $10M ARR"
            className="text-sm mt-1"
            disabled={generateMutation.isPending}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Additional Context</Label>
          <Textarea
            value={targetContext}
            onChange={(e) => setTargetContext(e.target.value)}
            placeholder="Industry, company size, challenges..."
            rows={3}
            className="text-sm mt-1"
            disabled={generateMutation.isPending}
          />
        </div>

        <Button
          onClick={handleRegenerate}
          disabled={!targetAudience.trim() || generateMutation.isPending}
          className="w-full"
          size="sm"
        >
          {generateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1.5" />
          )}
          {generateMutation.isPending ? "Generating..." : "Generate New ICP"}
        </Button>

        <p className="text-[10px] text-muted-foreground/60 text-center">
          Creates a new ICP and navigates to it
        </p>
      </div>

      <Separator />

      {/* Quick Stats */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          Quick Stats
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-lg font-bold">{pains.length}</p>
            <p className="text-[10px] text-muted-foreground">Pains</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-lg font-bold">{gains.length}</p>
            <p className="text-[10px] text-muted-foreground">Gains</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{filled}/{total} fields complete</span>
          <Badge
            variant={filled === total ? "default" : "secondary"}
            className={cn("text-[10px]", filled === total && "bg-emerald-500")}
          >
            {Math.round((filled / total) * 100)}%
          </Badge>
        </div>
      </div>

      {icp.created_at && (
        <>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Created{" "}
            {new Date(icp.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </>
      )}
    </div>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────

function DeleteICPDialog({
  open,
  onOpenChange,
  icp,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  icp: ICP;
  onDeleted: () => void;
}) {
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              deleteMutation.mutate(icp.id, {
                onSuccess: () => {
                  toast.success(`"${icp.name}" deleted`);
                  onOpenChange(false);
                  onDeleted();
                },
                onError: (e) => toast.error(`Delete failed: ${e.message}`),
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

export default function ICPDetailPage() {
  const params = useParams();
  const router = useRouter();
  const icpId = params.id as string;

  const { author, isLoading: authorLoading } = useAuthor();
  const { data: icp, isLoading: icpLoading } = useICPDetail(icpId);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isLoading = authorLoading || icpLoading;

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

  if (!icp) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold mb-2">ICP not found</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This ICP may have been deleted or the link is invalid.
        </p>
        <Button variant="outline" asChild>
          <Link href="/authority/icps">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to ICPs
          </Link>
        </Button>
      </div>
    );
  }

  const { filled, total } = icpCompleteness(icp);
  const pains = (icp.pains_gains || []).filter(
    (pg) => pg.pain_title || pg.pain_description || pg.description
  );
  const gains = (icp.pains_gains || []).filter(
    (pg) => pg.gain_title || pg.gain_description || pg.hope_dream
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link href="/authority/icps">
              <ArrowLeft className="h-4 w-4 mr-1" />
              ICPs
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-xl font-bold truncate">{icp.name}</h1>
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
          <DemographicsSection icp={icp} icpId={icpId} />

          <TwoColumnTextSection
            icon={ShoppingBag}
            title="Purchase Intelligence"
            leftTitle="Previous Actions"
            leftValue={icp.previous_actions}
            leftFieldKey="previous_actions"
            leftPlaceholder="What actions have they taken before?"
            rightTitle="Purchase Drivers"
            rightValue={icp.purchase_drivers}
            rightFieldKey="purchase_drivers"
            rightPlaceholder="What drives their purchasing decisions?"
            icpId={icpId}
          />

          <TwoColumnTextSection
            icon={Heart}
            title="Emotional Landscape"
            leftTitle="Frustrations & Fears"
            leftValue={icp.frustrations}
            leftFieldKey="frustrations"
            leftPlaceholder="What keeps them up at night?"
            rightTitle="Wants & Aspirations"
            rightValue={icp.aspirations}
            rightFieldKey="aspirations"
            rightPlaceholder="What do they want to achieve?"
            icpId={icpId}
          />

          <TransformationSection icp={icp} icpId={icpId} />

          {/* Pains (read-only) */}
          {pains.length > 0 && (
            <Section icon={AlertTriangle} title={`Pains (${pains.length})`}>
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
                    {item.category && (
                      <Badge variant="secondary" className="text-[10px] mt-2">{item.category}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Gains (read-only) */}
          {gains.length > 0 && (
            <Section icon={Star} title={`Hopes & Gains (${gains.length})`}>
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
                    {item.category && (
                      <Badge variant="secondary" className="text-[10px] mt-2">{item.category}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* No pains/gains message */}
          {pains.length === 0 && gains.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No pains or gains defined. Use AI generation to create a complete ICP with pains and gains.
              </p>
            </div>
          )}

          <EditableTextSection
            icon={Filter}
            title="Sales Navigator Filters"
            value={icp.sales_filters}
            fieldKey="sales_filters"
            icpId={icpId}
            placeholder="Sales Navigator filter criteria for finding this audience"
          />
        </div>

        {/* Right column: AI + stats (sticky) */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          {author?.brand_id && (
            <RegenerationPanel icp={icp} brandId={author.brand_id} />
          )}
        </div>
      </div>

      {/* Delete dialog */}
      {deleteOpen && icp && (
        <DeleteICPDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          icp={icp}
          onDeleted={() => router.push("/authority/icps")}
        />
      )}
    </div>
  );
}
