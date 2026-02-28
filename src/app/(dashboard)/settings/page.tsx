"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import {
  Settings,
  User,
  Palette,
  Cpu,
  Database,
  Loader2,
  Check,
  Upload,
  Download,
  AlertCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import {
  useModelPreferences,
  useAvailableModels,
  useUpdateModelPreferences,
  useUploadModelsCsv,
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
  const uploadCsv = useUploadModelsCsv();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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
                <SelectItem value="72">72 hours (3 days)</SelectItem>
                <SelectItem value="168">168 hours (1 week)</SelectItem>
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

      {/* Model Registry (Admin) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <CardTitle className="text-sm">Model Registry</CardTitle>
          </div>
          <CardDescription>
            Upload a CSV to add or update available AI models and pricing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file?.name.endsWith(".csv")) {
                uploadCsv.mutate(file, {
                  onSuccess: (data) => {
                    toast.success(
                      `${data.rows_upserted} model(s) upserted, ${data.rows_deactivated} deactivated`
                    );
                    if (data.errors.length > 0) {
                      toast.warning(`${data.errors.length} row(s) had errors`);
                    }
                  },
                  onError: (err) =>
                    toast.error(
                      err instanceof Error ? err.message : "Upload failed"
                    ),
                });
              } else {
                toast.error("Please upload a .csv file");
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  uploadCsv.mutate(file, {
                    onSuccess: (data) => {
                      toast.success(
                        `${data.rows_upserted} model(s) upserted, ${data.rows_deactivated} deactivated`
                      );
                      if (data.errors.length > 0) {
                        toast.warning(
                          `${data.errors.length} row(s) had errors`
                        );
                      }
                    },
                    onError: (err) =>
                      toast.error(
                        err instanceof Error ? err.message : "Upload failed"
                      ),
                  });
                }
                e.target.value = "";
              }}
            />
            {uploadCsv.isPending ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            ) : (
              <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {uploadCsv.isPending
                ? "Uploading..."
                : "Drop a CSV here or click to browse"}
            </p>
          </div>

          {/* Upload result */}
          {uploadCsv.data && (
            <div className="rounded-md border p-3 space-y-1 text-xs">
              <p>
                <span className="font-medium">{uploadCsv.data.rows_upserted}</span> upserted,{" "}
                <span className="font-medium">{uploadCsv.data.rows_deactivated}</span> deactivated
              </p>
              {uploadCsv.data.errors.length > 0 && (
                <div className="space-y-0.5 text-destructive">
                  {uploadCsv.data.errors.map((err, i) => (
                    <p key={i} className="flex items-start gap-1">
                      <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                      {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Download template */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {
              const header =
                "model_id,display_name,provider,input_cost_per_1m,output_cost_per_1m,tier_compatibility,is_active";
              const example =
                "gpt-5-nano,GPT-5 Nano,openai,0.05,0.40,fast;research,true";
              const blob = new Blob([header + "\n" + example + "\n"], {
                type: "text/csv",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "models_template.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-3 w-3" />
            Download Template CSV
          </Button>

          <Separator />

          {/* Current models table */}
          <div>
            <p className="text-xs font-medium mb-2">
              Current Models ({models.length})
            </p>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 font-medium">Model</th>
                    <th className="text-left p-2 font-medium">Provider</th>
                    <th className="text-right p-2 font-medium">In / Out</th>
                    <th className="text-left p-2 font-medium">Tiers</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => (
                    <tr key={m.model_id} className="border-t">
                      <td className="p-2 font-medium">{m.display_name}</td>
                      <td className="p-2 text-muted-foreground">
                        {m.provider}
                      </td>
                      <td className="p-2 text-right tabular-nums text-muted-foreground">
                        ${m.input_cost_per_1m.toFixed(2)} / $
                        {m.output_cost_per_1m.toFixed(2)}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-0.5">
                          {m.tier_compatibility.map((t) => (
                            <Badge
                              key={t}
                              variant="outline"
                              className="text-[9px]"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
