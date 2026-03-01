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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Globe,
  Linkedin,
  Building2,
  Pencil,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import { useBrands } from "@/lib/api/hooks/use-brands";
import { AddBrandModal } from "@/components/brands/add-brand-modal";
import { EditBrandDialog } from "@/components/brands/edit-brand-dialog";
import type { Brand } from "@/lib/api/types";
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
import {
  useUserProfile,
  useUpdateUserProfile,
} from "@/lib/api/hooks/use-user-profile";
import {
  useLinkedInSyncSettings,
  useUpdateLinkedInSyncSettings,
} from "@/lib/api/hooks/use-linkedin-sync-settings";

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

  // Account settings
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  const [fullName, setFullName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  // Brand management
  const { data: brandsData, isLoading: brandsLoading } = useBrands();
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // LinkedIn sync settings
  const { data: syncSettings, isLoading: syncLoading } = useLinkedInSyncSettings();
  const updateSync = useUpdateLinkedInSyncSettings();
  const [syncMaxPosts, setSyncMaxPosts] = useState(20);
  const [syncMaxComments, setSyncMaxComments] = useState(5);
  const [syncMaxReactions, setSyncMaxReactions] = useState(5);
  const [syncIncludeReposts, setSyncIncludeReposts] = useState(true);
  const [syncIncludeQuotePosts, setSyncIncludeQuotePosts] = useState(true);
  const [syncScrapeComments, setSyncScrapeComments] = useState(false);
  const [syncScrapeReactions, setSyncScrapeReactions] = useState(false);
  const [syncSaved, setSyncSaved] = useState(false);

  useEffect(() => {
    if (prefsData?.preferences) {
      setFast(prefsData.preferences.tier_fast);
      setResearch(prefsData.preferences.tier_research);
      setWriting(prefsData.preferences.tier_writing);
    }
  }, [prefsData]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setTimezone(profile.timezone ?? "America/New_York");
      setLinkedinUrl(profile.linkedin_url ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (syncSettings) {
      setSyncMaxPosts(syncSettings.linkedin_sync_max_posts ?? 20);
      setSyncMaxComments(syncSettings.linkedin_sync_max_comments ?? 5);
      setSyncMaxReactions(syncSettings.linkedin_sync_max_reactions ?? 5);
      setSyncIncludeReposts(syncSettings.linkedin_sync_include_reposts ?? true);
      setSyncIncludeQuotePosts(syncSettings.linkedin_sync_include_quote_posts ?? true);
      setSyncScrapeComments(syncSettings.linkedin_sync_scrape_comments ?? false);
      setSyncScrapeReactions(syncSettings.linkedin_sync_scrape_reactions ?? false);
    }
  }, [syncSettings]);

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

      {/* Brand Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <CardTitle className="text-sm">Brand Management</CardTitle>
            </div>
            <AddBrandModal />
          </div>
          <CardDescription>Manage your company and individual brands.</CardDescription>
        </CardHeader>
        <CardContent>
          {brandsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : brandsData?.hierarchy?.length ? (
            <div className="space-y-3">
              {brandsData.hierarchy.map((company) => (
                <div key={company.id} className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: company.brand_color ?? "#6366f1" }}
                      />
                      <span className="text-sm font-medium">{company.name}</span>
                      <Badge variant="secondary" className="text-[10px]">Company</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingBrand(company)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {company.children?.map((child) => (
                    <div
                      key={child.id}
                      className="ml-6 flex items-center justify-between rounded-md border border-dashed p-3"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: child.brand_color ?? "#a78bfa" }}
                        />
                        <span className="text-sm">{child.name}</span>
                        <Badge variant="outline" className="text-[10px]">Individual</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingBrand(child)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No brands found. Create one to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {editingBrand && (
        <EditBrandDialog
          brand={editingBrand}
          open={!!editingBrand}
          onOpenChange={(v) => { if (!v) setEditingBrand(null); }}
        />
      )}

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <CardTitle className="text-sm">Account Settings</CardTitle>
          </div>
          <CardDescription>
            Your personal account details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="timezone" className="text-xs">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern (New York)</SelectItem>
                    <SelectItem value="America/Chicago">Central (Chicago)</SelectItem>
                    <SelectItem value="America/Denver">Mountain (Denver)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific (Los Angeles)</SelectItem>
                    <SelectItem value="America/Anchorage">Alaska</SelectItem>
                    <SelectItem value="Pacific/Honolulu">Hawaii</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkedinUrl" className="text-xs">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/your-profile"
                  className="h-8 text-sm"
                />
              </div>
              <Button
                onClick={() => {
                  updateProfile.mutate(
                    { full_name: fullName, timezone, linkedin_url: linkedinUrl },
                    {
                      onSuccess: () => {
                        setProfileSaved(true);
                        toast.success("Account settings saved");
                        setTimeout(() => setProfileSaved(false), 2000);
                      },
                      onError: (err) =>
                        toast.error(err instanceof Error ? err.message : "Failed to save"),
                    }
                  );
                }}
                disabled={updateProfile.isPending || profileSaved}
                className="w-full gap-2"
                size="sm"
              >
                {updateProfile.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : profileSaved ? (
                  <Check className="h-3.5 w-3.5" />
                ) : null}
                {updateProfile.isPending ? "Saving..." : profileSaved ? "Saved" : "Save Account Settings"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* LinkedIn Sync Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Linkedin className="h-4 w-4" />
            <CardTitle className="text-sm">LinkedIn Sync Configuration</CardTitle>
          </div>
          <CardDescription>
            Default settings for LinkedIn performance data scraping.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {syncLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="syncMaxPosts" className="text-xs">Max Posts</Label>
                  <Input
                    id="syncMaxPosts"
                    type="number"
                    value={syncMaxPosts}
                    onChange={(e) => setSyncMaxPosts(Number(e.target.value))}
                    className="h-8 text-sm"
                    min={1}
                    max={100}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="syncMaxComments" className="text-xs">Max Comments</Label>
                  <Input
                    id="syncMaxComments"
                    type="number"
                    value={syncMaxComments}
                    onChange={(e) => setSyncMaxComments(Number(e.target.value))}
                    className="h-8 text-sm"
                    min={0}
                    max={50}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="syncMaxReactions" className="text-xs">Max Reactions</Label>
                  <Input
                    id="syncMaxReactions"
                    type="number"
                    value={syncMaxReactions}
                    onChange={(e) => setSyncMaxReactions(Number(e.target.value))}
                    className="h-8 text-sm"
                    min={0}
                    max={50}
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Include Reposts</p>
                    <p className="text-[10px] text-muted-foreground">Scrape reposted content</p>
                  </div>
                  <Switch checked={syncIncludeReposts} onCheckedChange={setSyncIncludeReposts} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Include Quote Posts</p>
                    <p className="text-[10px] text-muted-foreground">Scrape quote posts</p>
                  </div>
                  <Switch checked={syncIncludeQuotePosts} onCheckedChange={setSyncIncludeQuotePosts} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Scrape Comments</p>
                    <p className="text-[10px] text-muted-foreground">Collect post comments</p>
                  </div>
                  <Switch checked={syncScrapeComments} onCheckedChange={setSyncScrapeComments} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Scrape Reactions</p>
                    <p className="text-[10px] text-muted-foreground">Collect post reactions</p>
                  </div>
                  <Switch checked={syncScrapeReactions} onCheckedChange={setSyncScrapeReactions} />
                </div>
              </div>
              <Button
                onClick={() => {
                  updateSync.mutate(
                    {
                      linkedin_sync_max_posts: syncMaxPosts,
                      linkedin_sync_max_comments: syncMaxComments,
                      linkedin_sync_max_reactions: syncMaxReactions,
                      linkedin_sync_include_reposts: syncIncludeReposts,
                      linkedin_sync_include_quote_posts: syncIncludeQuotePosts,
                      linkedin_sync_scrape_comments: syncScrapeComments,
                      linkedin_sync_scrape_reactions: syncScrapeReactions,
                    },
                    {
                      onSuccess: () => {
                        setSyncSaved(true);
                        toast.success("LinkedIn sync settings saved");
                        setTimeout(() => setSyncSaved(false), 2000);
                      },
                      onError: (err) =>
                        toast.error(err instanceof Error ? err.message : "Failed to save"),
                    }
                  );
                }}
                disabled={updateSync.isPending || syncSaved}
                className="w-full gap-2"
                size="sm"
              >
                {updateSync.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : syncSaved ? (
                  <Check className="h-3.5 w-3.5" />
                ) : null}
                {updateSync.isPending ? "Saving..." : syncSaved ? "Saved" : "Save Sync Settings"}
              </Button>
            </>
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
