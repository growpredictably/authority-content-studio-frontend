"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Loader2,
  X,
  User,
  BookOpen,
  Puzzle,
  Sparkles,
  Headphones,
  Trash2,
} from "lucide-react";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import {
  useFrameworks,
  useCreateFramework,
  useDeleteFramework,
  useReorderFrameworks,
} from "@/lib/api/hooks/use-frameworks";
import { useExtractFramework } from "@/lib/api/hooks/use-extract-framework";
import { useTranscriptionList } from "@/lib/api/hooks/use-transcriptions";
import { FrameworkLibraryDrawer } from "@/components/brands/framework-library-drawer";
import {
  ENRICHABLE_FIELD_OPTIONS,
  safeComponents,
  fieldCompleteness,
} from "@/lib/frameworks/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BrandFramework } from "@/lib/api/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Framework Card ─────────────────────────────────────────────

function FrameworkCard({
  fw,
  onClick,
}: {
  fw: BrandFramework;
  onClick: () => void;
}) {
  const components = safeComponents(fw.key_components);
  const name = fw.name || fw.framework_name || "Untitled Framework";
  const { filled, total } = fieldCompleteness(fw);
  const preview = fw.purpose_overview || fw.unique_benefit;

  return (
    <div
      className="group relative w-full text-left rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer bg-card hover:bg-accent/50"
      onClick={onClick}
    >
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
        <span
          className={cn(
            "text-[10px] tabular-nums",
            filled === total ? "text-emerald-500" : "text-muted-foreground"
          )}
        >
          {filled}/{total}
        </span>
      </div>
    </div>
  );
}

// ─── Sortable Wrapper ───────────────────────────────────────────

function SortableFrameworkCard({
  fw,
  onClick,
}: {
  fw: BrandFramework;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fw.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <FrameworkCard fw={fw} onClick={onClick} />
    </div>
  );
}

// ─── Key Components Editor ─────────────────────────────────────

interface ComponentEntry {
  name: string;
  description: string;
}

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
        <Label>Key Components</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange([...components, { name: "", description: "" }])}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
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

// ─── New Framework Dialog (creation only) ────────────────────────

function NewFrameworkDialog({
  open,
  onOpenChange,
  authorId,
  userId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  authorId: string;
  userId: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [frameworkAuthor, setFrameworkAuthor] = useState("");
  const [keyComponents, setKeyComponents] = useState<ComponentEntry[]>([]);
  const [aiTranscriptId, setAiTranscriptId] = useState<string>("");
  const [aiBatch, setAiBatch] = useState(false);
  const [fieldsToGenerate, setFieldsToGenerate] = useState<Set<string>>(
    new Set(ENRICHABLE_FIELD_OPTIONS.map((f) => f.key))
  );

  const createMutation = useCreateFramework();
  const extractFramework = useExtractFramework();
  const { data: transcripts } = useTranscriptionList(userId);

  const toggleField = (key: string) => {
    setFieldsToGenerate((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const allFieldsSelected = fieldsToGenerate.size === ENRICHABLE_FIELD_OPTIONS.length;
  const toggleAllFields = () => {
    if (allFieldsSelected) setFieldsToGenerate(new Set());
    else setFieldsToGenerate(new Set(ENRICHABLE_FIELD_OPTIONS.map((f) => f.key)));
  };

  const aiPending = extractFramework.isPending;
  const isPending = createMutation.isPending || aiPending;

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Framework name is required");
      return;
    }
    const key_components_clean = keyComponents
      .filter((c) => c.name.trim())
      .map((c) => ({ name: c.name.trim(), description: c.description.trim() || undefined }));
    const payload: Record<string, unknown> = {
      author_id: authorId,
      name: name.trim(),
    };
    if (frameworkAuthor.trim()) payload.framework_author = frameworkAuthor.trim();
    if (key_components_clean.length > 0) payload.key_components = key_components_clean;

    createMutation.mutate(payload, {
      onSuccess: (result) => {
        toast.success("Framework created");
        onOpenChange(false);
        resetForm();
        if (result?.id) router.push(`/authority/frameworks/${result.id}`);
      },
      onError: (e) => toast.error(`Failed to create: ${e.message}`),
    });
  };

  const handleAiGenerate = () => {
    if (!aiTranscriptId) {
      toast.error("Select a transcript first");
      return;
    }
    extractFramework.mutate(
      {
        transcriptionId: Number(aiTranscriptId),
        authorId,
        frameworkName: name.trim() || undefined,
        useBatch: aiBatch,
      },
      {
        onSuccess: (result) => {
          onOpenChange(false);
          resetForm();
          if ("batch" in result && result.batch) {
            toast.info("Framework generation submitted. Results will be ready within 24 hours.");
          } else if ("id" in result && result.id) {
            toast.success("Framework generated!");
            router.push(`/authority/frameworks/${result.id}`);
          } else {
            toast.success("Framework generated! Click it to review.");
          }
        },
        onError: (e) => toast.error(`Generation failed: ${e.message}`),
      }
    );
  };

  const resetForm = () => {
    setName("");
    setFrameworkAuthor("");
    setKeyComponents([]);
    setAiTranscriptId("");
    setAiBatch(false);
    setFieldsToGenerate(new Set(ENRICHABLE_FIELD_OPTIONS.map((f) => f.key)));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!aiPending) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Framework</DialogTitle>
          <DialogDescription>Define a new signature framework.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* AI Generation Section */}
          {transcripts && transcripts.length > 0 && (
            <>
              <div className="rounded-lg border border-dashed p-4 space-y-3 bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Generate from Transcript
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Select Fireflies transcript
                  </Label>
                  <Select value={aiTranscriptId} onValueChange={setAiTranscriptId} disabled={aiPending}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a transcript..." />
                    </SelectTrigger>
                    <SelectContent>
                      {transcripts.map((tx) => (
                        <SelectItem key={tx.id} value={String(tx.id)}>
                          <div className="flex items-center gap-2">
                            <Headphones className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{tx.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fields to generate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Fields to generate</Label>
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
                          id={`gen-${field.key}`}
                          checked={fieldsToGenerate.has(field.key)}
                          onCheckedChange={() => toggleField(field.key)}
                          disabled={aiPending}
                        />
                        <Label
                          htmlFor={`gen-${field.key}`}
                          className="text-xs font-normal cursor-pointer text-muted-foreground"
                          title={field.description}
                        >
                          {field.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="new-ai-batch"
                    checked={aiBatch}
                    onCheckedChange={(v) => setAiBatch(v === true)}
                    disabled={aiPending}
                  />
                  <Label htmlFor="new-ai-batch" className="text-xs font-normal cursor-pointer text-muted-foreground">
                    Use batch processing (50% cheaper, ~24 hours)
                  </Label>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAiGenerate}
                  disabled={!aiTranscriptId || aiPending}
                  className="w-full"
                >
                  {aiPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Generate with AI
                </Button>
              </div>

              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  or create manually
                </span>
              </div>
            </>
          )}

          {/* Manual Creation */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fw-name">Name *</Label>
              <Input
                id="fw-name"
                placeholder="e.g. The Authority Flywheel"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="fw-author">Framework Author</Label>
              <Input
                id="fw-author"
                placeholder="Who created this framework?"
                value={frameworkAuthor}
                onChange={(e) => setFrameworkAuthor(e.target.value)}
              />
            </div>
          </div>

          <KeyComponentsEditor
            components={keyComponents}
            onChange={setKeyComponents}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isPending}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Create Framework
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirmation ────────────────────────────────────────

function DeleteFrameworkDialog({
  open,
  onOpenChange,
  framework,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  framework: BrandFramework;
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              deleteMutation.mutate(framework.id, {
                onSuccess: () => {
                  toast.success(`"${name}" deleted`);
                  onOpenChange(false);
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

// ─── Main Page ──────────────────────────────────────────────────

export default function FrameworksPage() {
  const router = useRouter();
  const { author, isLoading: authorLoading } = useAuthor();
  const { data, isLoading: fwLoading } = useFrameworks(author?.id);
  const reorderMutation = useReorderFrameworks();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteFW, setDeleteFW] = useState<BrandFramework | undefined>();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [localOrder, setLocalOrder] = useState<BrandFramework[] | null>(null);

  const isLoading = authorLoading || fwLoading;
  const frameworks = localOrder ?? data?.frameworks ?? [];

  // Reset local order when server data changes
  const serverFrameworks = data?.frameworks;
  const prevRef = useState<typeof serverFrameworks>(undefined);
  if (serverFrameworks !== prevRef[0]) {
    prevRef[0] = serverFrameworks;
    if (localOrder) setLocalOrder(null);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !author) return;

      const oldIdx = frameworks.findIndex((f) => f.id === active.id);
      const newIdx = frameworks.findIndex((f) => f.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;

      const reordered = arrayMove(frameworks, oldIdx, newIdx);
      setLocalOrder(reordered);

      reorderMutation.mutate(
        { authorId: author.id, orderedIds: reordered.map((f) => f.id) },
        {
          onError: () => {
            setLocalOrder(null);
            toast.error("Failed to save order");
          },
        }
      );
    },
    [frameworks, author, reorderMutation]
  );

  const navigateToFramework = (id: string) => {
    router.push(`/authority/frameworks/${id}`);
  };

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
          <div className="flex items-center gap-2">
            <Button onClick={() => setLibraryOpen(true)} variant="outline" size="sm">
              <BookOpen className="h-4 w-4 mr-1.5" />
              Import from Library
            </Button>
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New Framework
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
      ) : frameworks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <Layers className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="font-medium">No frameworks yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Create your first signature framework to codify your methodology.
          </p>
          {author && (
            <Button
              onClick={() => setCreateOpen(true)}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create Your First Framework
            </Button>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={frameworks.map((f) => f.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {frameworks.map((fw) => (
                <SortableFrameworkCard
                  key={fw.id}
                  fw={fw}
                  onClick={() => navigateToFramework(fw.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {author && (
        <NewFrameworkDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          authorId={author.id}
          userId={author.user_id}
        />
      )}
      {deleteFW && (
        <DeleteFrameworkDialog
          open={!!deleteFW}
          onOpenChange={(v) => !v && setDeleteFW(undefined)}
          framework={deleteFW}
        />
      )}
      {author && (
        <FrameworkLibraryDrawer
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          authorId={author.id}
        />
      )}
    </div>
  );
}
