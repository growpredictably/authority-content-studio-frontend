"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Search,
  Loader2,
  ThumbsUp,
  MessageCircle,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAuthor } from "@/hooks/use-author";
import { AuthorSelector } from "@/components/shared/author-selector";
import {
  useMarketSessions,
  useMarketSessionDetail,
  useHuntWinningPosts,
} from "@/lib/api/hooks/use-market-analysis";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { MarketPost, MarketSession } from "@/lib/api/types";

// ─── Post Card ───────────────────────────────────────────────

function PostCard({ post }: { post: MarketPost }) {
  const truncated =
    post.post_content.length > 300
      ? post.post_content.slice(0, 300) + "..."
      : post.post_content;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Author */}
      <div>
        <p className="text-sm font-semibold">{post.author_name}</p>
        {post.author_headline && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {post.author_headline}
          </p>
        )}
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed whitespace-pre-line">{truncated}</p>

      {/* Engagement */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <ThumbsUp className="h-3.5 w-3.5" />
          {post.likes_count.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" />
          {post.comments_count.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Share2 className="h-3.5 w-3.5" />
          {post.shares_count.toLocaleString()}
        </span>
        {post.post_url && (
          <a
            href={post.post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Session Row ─────────────────────────────────────────────

function SessionRow({
  session,
  isSelected,
  onClick,
}: {
  session: MarketSession;
  isSelected: boolean;
  onClick: () => void;
}) {
  const date = session.created_at
    ? new Date(session.created_at).toLocaleDateString()
    : "";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border p-3 transition-all hover:bg-accent/50",
        isSelected && "border-primary bg-primary/5 ring-1 ring-primary"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSelected ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">{session.search_topic}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{session.post_count} posts</span>
          <span>{session.total_likes.toLocaleString()} likes</span>
          <span>{date}</span>
        </div>
      </div>
    </button>
  );
}

// ─── Session Detail ──────────────────────────────────────────

function SessionDetail({ sessionId }: { sessionId: string }) {
  const { data, isLoading } = useMarketSessionDetail(sessionId);

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data?.posts?.length) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No posts found in this session.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function MarketAnalysisPage() {
  const { author, isLoading: authorLoading } = useAuthor();
  const { data: sessionsData, isLoading: sessionsLoading } = useMarketSessions(
    author?.user_id
  );
  const huntMutation = useHuntWinningPosts();

  const [topic, setTopic] = useState("");
  const [minLikes, setMinLikes] = useState("50");
  const [limit, setLimit] = useState("20");
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // Results from the latest hunt (before it's in past sessions)
  const [huntResults, setHuntResults] = useState<MarketPost[] | null>(null);
  const [huntTopic, setHuntTopic] = useState("");

  const isLoading = authorLoading || sessionsLoading;
  const sessions = sessionsData?.sessions || [];

  function handleHunt() {
    if (!topic.trim() || !author) return;

    const sessionId = `mh_${Date.now()}`;
    setHuntResults(null);

    huntMutation.mutate(
      {
        payload: {
          topic: topic.trim(),
          limit: parseInt(limit) || 20,
          minLikes: parseInt(minLikes) || 50,
          session_id: sessionId,
        },
        user_id: author.user_id,
        author_id: author.id,
        author_name: author.name,
        brand_id: author.brand_id || "",
      },
      {
        onSuccess: (res) => {
          toast.success(`Found ${res.total_results} winning posts`);
          setHuntResults(res.posts);
          setHuntTopic(res.topic);
        },
        onError: (e) => toast.error(`Hunt failed: ${e.message}`),
      }
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Market Hunter</h1>
          <AuthorSelector />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Find winning LinkedIn posts in your market for content inspiration
        </p>
      </div>

      {/* Search Form */}
      {author && (
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div>
            <Label htmlFor="hunt-topic">Search Topic</Label>
            <Input
              id="hunt-topic"
              placeholder='e.g. "B2B SaaS growth strategies"'
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={huntMutation.isPending}
              onKeyDown={(e) => e.key === "Enter" && handleHunt()}
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="w-32">
              <Label htmlFor="hunt-likes">Min Likes</Label>
              <Input
                id="hunt-likes"
                type="number"
                value={minLikes}
                onChange={(e) => setMinLikes(e.target.value)}
                disabled={huntMutation.isPending}
              />
            </div>
            <div className="w-32">
              <Label htmlFor="hunt-limit">Max Results</Label>
              <Input
                id="hunt-limit"
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                disabled={huntMutation.isPending}
              />
            </div>
            <Button
              onClick={handleHunt}
              disabled={huntMutation.isPending || !topic.trim()}
              className="gap-1.5"
            >
              {huntMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {huntMutation.isPending ? "Hunting..." : "Hunt"}
            </Button>
          </div>
        </div>
      )}

      {/* Live Results */}
      {huntResults && huntResults.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Results for &quot;{huntTopic}&quot; ({huntResults.length} posts)
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {huntResults.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {huntResults && huntResults.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No posts matched your criteria. Try lowering the minimum likes or
            broadening the topic.
          </p>
        </div>
      )}

      {/* Past Sessions */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : sessions.length > 0 ? (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Past Sessions ({sessions.length})
          </h2>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div key={session.session_id}>
                <SessionRow
                  session={session}
                  isSelected={expandedSession === session.session_id}
                  onClick={() =>
                    setExpandedSession(
                      expandedSession === session.session_id
                        ? null
                        : session.session_id
                    )
                  }
                />
                {expandedSession === session.session_id && (
                  <div className="mt-2 ml-6">
                    <SessionDetail sessionId={session.session_id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : (
        !huntResults && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-medium">No past hunts</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Search for a topic above to find winning LinkedIn posts in your
              market.
            </p>
          </div>
        )
      )}
    </div>
  );
}
