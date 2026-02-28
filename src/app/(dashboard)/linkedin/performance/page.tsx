"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  ThumbsUp,
  MessageSquare,
  Share2,
  Heart,
  TrendingUp,
  ExternalLink,
  Link2,
  CalendarDays,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import { usePerformance } from "@/lib/api/hooks/use-performance";
import { useSyncLinkedIn, getLinkedInProfileUrl } from "@/lib/api/hooks/use-sync-linkedin";
import { usePerformanceIntel, useAnalyzePerformance } from "@/lib/api/hooks/use-performance-intel";
import type { PerformanceIntel } from "@/lib/api/hooks/use-performance-intel";
import { format } from "date-fns";
import type { LinkedInPostPerformance } from "@/lib/api/types";

type SortField = "posted_at" | "total_engagement";

export default function PerformancePage() {
  const { author, isLoading: authorLoading } = useAuthor();
  const { data, isLoading: perfLoading, error } = usePerformance(
    author?.id,
    author?.user_id
  );
  const syncMutation = useSyncLinkedIn();
  const { data: intelData } = usePerformanceIntel(author?.id);
  const analyzeMutation = useAnalyzePerformance();
  const [sortField, setSortField] = useState<SortField>("posted_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const isLoading = authorLoading || perfLoading;
  const posts = data?.linkedin_posts ?? [];
  const summary = data?.summary;
  const hasData = posts.length > 0;

  // Fetch stored LinkedIn profile URL
  useEffect(() => {
    if (author?.id) {
      getLinkedInProfileUrl(author.id).then(setProfileUrl);
    }
  }, [author?.id]);

  const handleSync = async (url?: string) => {
    const syncUrl = url || profileUrl;
    if (!syncUrl || !author) return;
    setShowUrlInput(false);
    syncMutation.mutate({
      user_id: author.user_id,
      author_id: author.id,
      author_name: author.name,
      brand_id: author.brand_id ?? "",
      targetUrl: syncUrl,
    });
  };

  // Sort posts
  const sorted = [...posts].sort((a, b) => {
    if (sortField === "posted_at") {
      const da = new Date(a.posted_at).getTime();
      const db = new Date(b.posted_at).getTime();
      return sortDir === "desc" ? db - da : da - db;
    }
    return sortDir === "desc"
      ? b.total_engagement - a.total_engagement
      : a.total_engagement - b.total_engagement;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Published Performance</h1>
            <AuthorSelector />
          </div>
          <p className="text-sm text-muted-foreground">
            Track engagement metrics for your LinkedIn posts
          </p>
        </div>

        {/* Sync Button */}
        <div className="flex items-center gap-2">
          {syncMutation.isSuccess && (
            <span className="text-xs text-green-600">
              {syncMutation.data?.message}
            </span>
          )}
          {syncMutation.isError && (
            <span className="text-xs text-red-500">
              Sync failed. Try again.
            </span>
          )}

          {profileUrl ? (
            <button
              onClick={() => handleSync()}
              disabled={syncMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {syncMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {syncMutation.isPending ? "Syncing..." : "Sync LinkedIn"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {showUrlInput ? (
                <>
                  <input
                    type="text"
                    placeholder="https://linkedin.com/in/your-profile"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="rounded-md border bg-background px-3 py-1.5 text-sm w-72"
                  />
                  <button
                    onClick={() => {
                      if (urlInput.includes("linkedin.com")) {
                        setProfileUrl(urlInput);
                        handleSync(urlInput);
                      }
                    }}
                    disabled={!urlInput.includes("linkedin.com") || syncMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {syncMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Sync
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowUrlInput(true)}
                  className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  <RefreshCw className="h-4 w-4" />
                  Sync LinkedIn
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : error ? (
        <Card className="mx-auto max-w-2xl border-red-200">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-red-400 mb-3" />
            <h2 className="text-lg font-semibold mb-2">Failed to Load Performance</h2>
            <p className="text-sm text-muted-foreground max-w-md mb-3">
              {error.message}
            </p>
            <p className="text-xs text-muted-foreground">
              Author: {author?.id ?? "not loaded"} | Author loaded: {String(!authorLoading)}
            </p>
          </CardContent>
        </Card>
      ) : !hasData ? (
        <Card className="mx-auto max-w-2xl">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Performance Data Yet</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Click &quot;Sync LinkedIn&quot; above to pull in your post metrics, or sync from
              the Command Center.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary stats */}
          {summary && (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <StatCard
                icon={<BarChart3 className="h-4 w-4" />}
                label="Total Posts"
                value={summary.total_posts}
              />
              <StatCard
                icon={<ThumbsUp className="h-4 w-4" />}
                label="Total Likes"
                value={summary.total_likes}
              />
              <StatCard
                icon={<MessageSquare className="h-4 w-4" />}
                label="Comments"
                value={summary.total_comments}
              />
              <StatCard
                icon={<Share2 className="h-4 w-4" />}
                label="Shares"
                value={summary.total_shares}
              />
              <StatCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="Avg Engagement"
                value={summary.avg_engagement_per_post}
              />
              <StatCard
                icon={<Link2 className="h-4 w-4" />}
                label="Linked"
                value={summary.linked_count}
              />
            </div>
          )}

          {/* Performance Intelligence Panel */}
          <IntelPanel
            intel={intelData?.intel ?? null}
            analyzedAt={intelData?.analyzed_at}
            postsAnalyzed={intelData?.posts_analyzed}
            isAnalyzing={analyzeMutation.isPending}
            onAnalyze={() => author?.id && analyzeMutation.mutate(author.id)}
          />

          {/* Sort controls */}
          <div className="flex items-center gap-3 text-sm">
            <select
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
            >
              <option value="posted_at">Date Posted</option>
              <option value="total_engagement">Engagement</option>
            </select>
            <select
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
            >
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </div>

          {/* Posts list */}
          <div className="space-y-4">
            {sorted.map((post) => (
              <PostCard key={post.post_id} post={post} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

function PostCard({ post }: { post: LinkedInPostPerformance }) {
  const dateStr = post.posted_at
    ? format(new Date(post.posted_at), "MMM d, yyyy")
    : "";

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex gap-6">
          {/* Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Meta */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{dateStr}</span>
              {post.author_name && (
                <>
                  <span className="text-muted-foreground/40">|</span>
                  <span className="font-medium text-foreground">{post.author_name}</span>
                </>
              )}
            </div>

            {/* Post content */}
            <p className="text-sm whitespace-pre-line">{post.content}</p>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {post.linkedin_url && (
                <a
                  href={post.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View on LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Engagement stats */}
          <div className="shrink-0 space-y-1 text-right min-w-[100px]">
            <EngagementStat
              icon={<ThumbsUp className="h-3 w-3 text-blue-500" />}
              value={post.engagement_likes}
              label="likes"
            />
            <EngagementStat
              icon={<MessageSquare className="h-3 w-3 text-green-500" />}
              value={post.engagement_comments}
              label="comments"
            />
            <EngagementStat
              icon={<Share2 className="h-3 w-3 text-orange-500" />}
              value={post.engagement_shares}
              label="shares"
            />
            <EngagementStat
              icon={<Heart className="h-3 w-3 text-red-500" />}
              value={post.empathy_count}
              label="empathy"
            />
            <div className="border-t pt-1 mt-1">
              <EngagementStat
                icon={<TrendingUp className="h-3 w-3 text-purple-500" />}
                value={post.total_engagement}
                label="total"
                bold
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EngagementStat({
  icon,
  value,
  label,
  bold,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      {icon}
      <span className={`text-xs tabular-nums ${bold ? "font-semibold" : ""}`}>
        {value.toLocaleString()}
      </span>
      <span className="text-[10px] text-muted-foreground w-16 text-left">
        {label}
      </span>
    </div>
  );
}

function IntelPanel({
  intel,
  analyzedAt,
  postsAnalyzed,
  isAnalyzing,
  onAnalyze,
}: {
  intel: PerformanceIntel | null;
  analyzedAt?: string;
  postsAnalyzed?: number;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-semibold">Performance Intelligence</h3>
            {analyzedAt && (
              <span className="text-[10px] text-muted-foreground">
                Last analyzed: {format(new Date(analyzedAt), "MMM d, yyyy")} ({postsAnalyzed} posts)
              </span>
            )}
          </div>
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <BarChart3 className="h-3 w-3" />
            )}
            {isAnalyzing ? "Analyzing..." : intel ? "Re-analyze" : "Analyze My Posts"}
          </button>
        </div>

        {!intel ? (
          <p className="text-xs text-muted-foreground">
            Click &quot;Analyze My Posts&quot; to discover what content works best for your
            audience. This intelligence will automatically feed into your content creation pipeline.
          </p>
        ) : (
          <>
            {/* Summary */}
            {intel.summary && (
              <p className="text-sm mb-3">{intel.summary}</p>
            )}

            {/* Collapsed preview */}
            {!expanded && (
              <div className="flex flex-wrap gap-2 mb-2">
                {intel.top_topics?.slice(0, 3).map((t, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800"
                  >
                    {t.topic}
                  </span>
                ))}
                {intel.best_hooks?.slice(0, 2).map((h, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                  >
                    {h.style}
                  </span>
                ))}
              </div>
            )}

            {/* Expanded detail */}
            {expanded && (
              <div className="space-y-4 mt-3">
                {/* Top Topics */}
                {intel.top_topics && intel.top_topics.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Top Topics</h4>
                    <div className="space-y-1">
                      {intel.top_topics.map((t, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="font-medium">{t.topic}</span>
                          <span className="text-muted-foreground">
                            avg {t.avg_engagement} engagement / {t.post_count} posts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Best Hooks */}
                {intel.best_hooks && intel.best_hooks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Best Hook Styles</h4>
                    <div className="space-y-2">
                      {intel.best_hooks.map((h, i) => (
                        <div key={i} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{h.style.replace(/_/g, " ")}</span>
                            <span className="text-muted-foreground">avg {h.avg_engagement}</span>
                          </div>
                          {h.example && (
                            <p className="text-muted-foreground mt-0.5 italic">&quot;{h.example.slice(0, 100)}&quot;</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engagement Insights */}
                {intel.engagement_insights && intel.engagement_insights.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Key Insights</h4>
                    <div className="space-y-1">
                      {intel.engagement_insights.map((ins, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-medium">{ins.pattern}</span>
                          <span className="text-muted-foreground"> — {ins.recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audience Preferences */}
                {intel.audience_preferences && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Audience Preferences</h4>
                    <div className="text-xs space-y-1">
                      {intel.audience_preferences.responds_to?.length > 0 && (
                        <p><span className="font-medium">Responds to:</span> {intel.audience_preferences.responds_to.join(", ")}</p>
                      )}
                      {intel.audience_preferences.sweet_spot_length && (
                        <p><span className="font-medium">Ideal length:</span> {intel.audience_preferences.sweet_spot_length}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-purple-600 hover:text-purple-800 mt-2"
            >
              {expanded ? "Show less" : "Show full analysis"}
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
