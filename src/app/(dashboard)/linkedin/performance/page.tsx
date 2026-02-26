"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  ThumbsUp,
  MessageSquare,
  Eye,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { useAuthor } from "@/hooks/use-author";
import { usePerformance } from "@/lib/api/hooks/use-performance";
import { formatDistanceToNow } from "date-fns";
import type { LinkedInPostPerformance, ContentSession } from "@/lib/api/types";

export default function PerformancePage() {
  const { author } = useAuthor();
  const { data, isLoading } = usePerformance(author?.id);

  const posts = data?.linkedin_posts ?? [];
  const outcomes = data?.content_outcomes ?? [];
  const summary = data?.summary;
  const hasData = posts.length > 0 || outcomes.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">LinkedIn Performance</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : !hasData ? (
        <Card className="mx-auto max-w-2xl">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Performance Data Yet</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Sync your LinkedIn posts from the Command Center, or add outcomes
              to your drafts to start tracking performance here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary stats */}
          {summary && (
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                icon={<BarChart3 className="h-4 w-4 text-primary" />}
                label="Total Posts"
                value={summary.total_posts.toString()}
              />
              <StatCard
                icon={<Eye className="h-4 w-4 text-primary" />}
                label="Total Impressions"
                value={summary.total_impressions.toLocaleString()}
              />
              <StatCard
                icon={<ThumbsUp className="h-4 w-4 text-primary" />}
                label="Total Likes"
                value={summary.total_likes.toLocaleString()}
              />
              <StatCard
                icon={<TrendingUp className="h-4 w-4 text-primary" />}
                label="Avg Engagement"
                value={summary.avg_engagement_per_post.toString()}
                description="per post"
              />
            </div>
          )}

          {/* Synced LinkedIn Posts */}
          {posts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Synced LinkedIn Posts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {posts.map((post) => (
                  <PostRow key={post.post_id} post={post} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Content Outcomes */}
          {outcomes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Content Outcomes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {outcomes.map((session) => (
                  <OutcomeRow key={session.id} session={session} />
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2">{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-[10px] text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PostRow({ post }: { post: LinkedInPostPerformance }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs line-clamp-2">{post.content}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <ThumbsUp className="h-3 w-3" />
            {post.engagement_likes}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            {post.engagement_comments}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {post.engagement_shares} shares
          </span>
          {post.posting_type && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {post.posting_type}
            </Badge>
          )}
          {post.posted_at && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(post.posted_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
      {post.linkedin_url && (
        <a
          href={post.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

function OutcomeRow({ session }: { session: ContentSession }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">
          {session.title || "Untitled Draft"}
        </p>
        <div className="flex items-center gap-3 mt-2">
          {session.impressions != null && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Eye className="h-3 w-3" />
              {session.impressions.toLocaleString()}
            </span>
          )}
          {session.likes != null && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <ThumbsUp className="h-3 w-3" />
              {session.likes}
            </span>
          )}
          {session.comments != null && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {session.comments}
            </span>
          )}
          {session.content_type && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {session.content_type.replace("_", " ")}
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
      {session.published_url && (
        <a
          href={session.published_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
