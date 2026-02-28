"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Palette, Cpu, Database, Loader2, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import {
  useModelPreferences,
  useAvailableModels,
  useUpdateModelPreferences,
} from "@/lib/api/hooks/use-settings";
import {
  useSnapshotCacheTtl,
  useUpdateSnapshotCacheTtl,
} from "@/lib/api/hooks/use-app-settings";

export default function SettingsPage() {
  const { author, isLoading: authorLoading } = useAuthor();
  const { theme, setTheme } = useTheme();
  const { data: prefsData, isLoading: prefsLoading } = useModelPreferences(
    author?.id
  );
  const { data: modelsData } = useAvailableModels();
  const updatePrefs = useUpdateModelPreferences();
  const { data: cacheTtl } = useSnapshotCacheTtl();
  const updateCacheTtl = useUpdateSnapshotCacheTtl();

  const [fast, setFast] = useState("");
  const [research, setResearch] = useState("");
  const [writing, setWriting] = useState("");
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [cacheSaved, setCacheSaved] = useState(false);

  useEffect(() => {
    if (prefsData?.preferences) {
      setFast(prefsData.preferences.tier_fast);
      setResearch(prefsData.preferences.tier_research);
      setWriting(prefsData.preferences.tier_writing);
    }
  }, [prefsData]);

  const models = modelsData?.models ?? [];
  const fastModels = models.filter((m) =>
    m.tier_compatibility.includes("fast")
  );
  const researchModels = models.filter((m) =>
    m.tier_compatibility.includes("research")
  );
  const writingModels = models.filter((m) =>
    m.tier_compatibility.includes("writing")
  );

  function handleSavePrefs() {
    if (!author) return;

    updatePrefs.mutate(
      {
        authorId: author.id,
        preferences: {
          tier_fast: fast,
          tier_research: research,
          tier_writing: writing,
        },
      },
      {
        onSuccess: () => {
          setPrefsSaved(true);
          toast.success("Model preferences updated");
          setTimeout(() => setPrefsSaved(false), 2000);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to save preferences"
          );
        },
      }
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
        <AuthorSelector />
      </div>

      {/* Author Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <CardTitle className="text-sm">Author Profile</CardTitle>
          </div>
          <CardDescription>Your current author identity.</CardDescription>
        </CardHeader>
        <CardContent>
          {authorLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : author ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{author.name}</span>
                {author.archetype && (
                  <Badge variant="secondary" className="text-xs">
                    {author.archetype}
                  </Badge>
                )}
              </div>
              {author.archetype_description && (
                <p className="text-xs text-muted-foreground">
                  {author.archetype_description}
                </p>
              )}
              {author.brand_id && (
                <p className="text-xs text-muted-foreground">
                  Brand: {author.brand_id}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No author profile found.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <CardTitle className="text-sm">Appearance</CardTitle>
          </div>
          <CardDescription>
            Choose how the interface looks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm">Theme</span>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Model Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            <CardTitle className="text-sm">Model Preferences</CardTitle>
          </div>
          <CardDescription>
            Choose which AI models power each tier of the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {prefsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              <TierRow
                label="Fast Tier"
                description="Quick tasks: categorization, tagging, formatting"
                value={fast}
                onChange={setFast}
                models={fastModels}
              />
              <Separator />
              <TierRow
                label="Research Tier"
                description="Analysis: gap analysis, angle generation, drift scanning"
                value={research}
                onChange={setResearch}
                models={researchModels}
              />
              <Separator />
              <TierRow
                label="Writing Tier"
                description="Content creation: posts, articles, outlines"
                value={writing}
                onChange={setWriting}
                models={writingModels}
              />
              <Button
                onClick={handleSavePrefs}
                disabled={updatePrefs.isPending || prefsSaved}
                className="w-full gap-2"
                size="sm"
              >
                {updatePrefs.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : prefsSaved ? (
                  <Check className="h-3.5 w-3.5" />
                ) : null}
                {updatePrefs.isPending
                  ? "Saving..."
                  : prefsSaved
                    ? "Saved"
                    : "Save Preferences"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cache Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <CardTitle className="text-sm">Cache Settings</CardTitle>
          </div>
          <CardDescription>
            Control how long expensive backend responses are cached before
            re-fetching.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Gap Analysis TTL</p>
              <p className="text-[10px] text-muted-foreground">
                How long gap analysis results are cached before a fresh
                backend call
              </p>
            </div>
            <Select
              value={String(cacheTtl?.gap_analysis_hours ?? 24)}
              onValueChange={(v) => {
                const hours = Number(v);
                updateCacheTtl.mutate(
                  { gap_analysis_hours: hours },
                  {
                    onSuccess: () => {
                      setCacheSaved(true);
                      toast.success(`Cache TTL updated to ${hours}h`);
                      setTimeout(() => setCacheSaved(false), 2000);
                    },
                    onError: (err) => {
                      toast.error(
                        err instanceof Error
                          ? err.message
                          : "Failed to update cache TTL"
                      );
                    },
                  }
                );
              }}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="48">48 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {cacheSaved && (
            <p className="text-[10px] text-green-600 mt-2 flex items-center gap-1">
              <Check className="h-3 w-3" /> Saved
            </p>
          )}
        </CardContent>
      </Card>

      {/* Multi-Author Placeholder */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Team & Multi-Author
            <Badge variant="outline" className="text-[10px]">
              Coming Soon
            </Badge>
          </CardTitle>
          <CardDescription>
            Manage multiple author profiles, invite team members, and configure
            role-based access. This feature is planned for a future release.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function TierRow({
  label,
  description,
  value,
  onChange,
  models,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  models: { model_id: string; display_name: string; input_cost_per_1m: number; output_cost_per_1m: number }[];
}) {
  const selected = models.find((m) => m.model_id === value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.model_id} value={m.model_id}>
                <span className="font-medium">{m.display_name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selected && (
        <p className="text-[10px] text-muted-foreground text-right">
          ${selected.input_cost_per_1m.toFixed(2)} / ${selected.output_cost_per_1m.toFixed(2)} per 1M tokens
        </p>
      )}
    </div>
  );
}
