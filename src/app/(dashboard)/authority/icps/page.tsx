"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import {
  useICPs,
  useCreateICP,
  useGenerateICP,
} from "@/lib/api/hooks/use-icps";
import { humanize, safeObject, PARAGRAPH_KEYS, icpCompleteness } from "@/lib/icps/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ICP } from "@/lib/api/types";

// ─── ICP Card (for the grid) ────────────────────────────────────

function ICPCard({ icp }: { icp: ICP }) {
  const router = useRouter();
  const demo = safeObject(icp.demographics);
  const pains = (icp.pains_gains || []).filter(
    (pg) => pg.pain_title || pg.pain_description || pg.description
  );
  const gains = (icp.pains_gains || []).filter(
    (pg) => pg.gain_title || pg.gain_description || pg.hope_dream
  );
  const { filled, total } = icpCompleteness(icp);

  // Get structured attributes only (skip paragraphs)
  const demoAttrs = Object.entries(demo).filter(
    ([k, v]) => !PARAGRAPH_KEYS.has(k) && v !== null && v !== undefined && v !== ""
  );

  return (
    <button
      onClick={() => router.push(`/authority/icps/${icp.id}`)}
      className="w-full text-left rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:bg-accent/50"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-sm">{icp.name}</h3>
        <Badge
          variant={filled === total ? "default" : "secondary"}
          className={cn("text-[10px] shrink-0", filled === total && "bg-emerald-500")}
        >
          {filled}/{total}
        </Badge>
      </div>

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

// ─── New ICP Dialog (name only → navigate to detail) ────────────

function NewICPDialog({
  open,
  onOpenChange,
  authorId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  authorId: string;
}) {
  const router = useRouter();
  const createMutation = useCreateICP();
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("ICP name is required");
      return;
    }
    createMutation.mutate(
      { author_id: authorId, name: name.trim() },
      {
        onSuccess: (icp) => {
          toast.success(`"${icp.name}" created`);
          onOpenChange(false);
          setName("");
          router.push(`/authority/icps/${icp.id}`);
        },
        onError: (e) => toast.error(`Create failed: ${e.message}`),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New ICP</DialogTitle>
          <DialogDescription>
            Create a new Ideal Customer Profile. You can fill in details on the next page.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Label htmlFor="icp-name">Name *</Label>
          <Input
            id="icp-name"
            placeholder="e.g. Growth-Stage B2B Founders"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={createMutation.isPending || !name.trim()}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Create ICP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── AI Generate Dialog ────────────────────────────────────────

function ICPGenerateDialog({
  open,
  onOpenChange,
  brandId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  brandId: string;
}) {
  const router = useRouter();
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
            router.push(`/authority/icps/${res.icp.id}`);
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

// ─── Main Page ──────────────────────────────────────────────────

export default function ICPsPage() {
  const { author, isLoading: authorLoading } = useAuthor();
  const { data, isLoading: icpsLoading } = useICPs(author?.id);

  const [createOpen, setCreateOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);

  const isLoading = authorLoading || icpsLoading;
  const icps = data?.icps || [];

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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {icps.map((icp) => (
            <ICPCard key={icp.id} icp={icp} />
          ))}
        </div>
      )}

      {author && <NewICPDialog open={createOpen} onOpenChange={setCreateOpen} authorId={author.id} />}
      {author?.brand_id && (
        <ICPGenerateDialog open={generateOpen} onOpenChange={setGenerateOpen} brandId={author.brand_id} />
      )}
    </div>
  );
}
