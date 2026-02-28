"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  PerformanceResponse,
  LinkedInPostPerformance,
  PerformanceSummary,
} from "@/lib/api/types";

/**
 * Fetch LinkedIn performance data directly from Supabase.
 * Queries my_linkedin_posts by author_id (with user_id fallback).
 */
export function usePerformance(
  authorId: string | undefined,
  userId?: string
) {
  return useQuery({
    queryKey: ["performance", authorId],
    queryFn: async (): Promise<PerformanceResponse> => {
      const supabase = createClient();

      // Query posts by author_id first
      let { data: posts, error } = await supabase
        .from("my_linkedin_posts")
        .select(
          "post_id, content, posted_at, linkedin_url, posting_type, author_name, engagement_likes, engagement_comments, engagement_shares, empathy_count"
        )
        .eq("author_id", authorId!)
        .order("posted_at", { ascending: false })
        .limit(50);

      // Fallback to user_id if no posts found by author_id
      if ((!posts || posts.length === 0) && userId) {
        const fallback = await supabase
          .from("my_linkedin_posts")
          .select(
            "post_id, content, posted_at, linkedin_url, posting_type, author_name, engagement_likes, engagement_comments, engagement_shares, empathy_count"
          )
          .eq("user_id", userId)
          .order("posted_at", { ascending: false })
          .limit(50);
        posts = fallback.data;
        error = fallback.error;
      }

      if (error) throw error;

      const linkedin_posts: LinkedInPostPerformance[] = (posts || []).map(
        (p) => {
          const likes = p.engagement_likes ?? 0;
          const comments = p.engagement_comments ?? 0;
          const shares = p.engagement_shares ?? 0;
          const empathy = p.empathy_count ?? 0;
          const content = p.content ?? "";
          return {
            post_id: p.post_id,
            content:
              content.length > 300
                ? content.slice(0, 300) + "..."
                : content,
            posted_at: p.posted_at,
            linkedin_url: p.linkedin_url,
            posting_type: p.posting_type,
            author_name: p.author_name,
            engagement_likes: likes,
            engagement_comments: comments,
            engagement_shares: shares,
            empathy_count: empathy,
            total_engagement: likes + comments + shares + empathy,
          };
        }
      );

      const total_likes = linkedin_posts.reduce(
        (s, p) => s + p.engagement_likes,
        0
      );
      const total_comments = linkedin_posts.reduce(
        (s, p) => s + p.engagement_comments,
        0
      );
      const total_shares = linkedin_posts.reduce(
        (s, p) => s + p.engagement_shares,
        0
      );
      const total_empathy = linkedin_posts.reduce(
        (s, p) => s + p.empathy_count,
        0
      );
      const total_eng = linkedin_posts.reduce(
        (s, p) => s + p.total_engagement,
        0
      );

      const summary: PerformanceSummary = {
        total_posts: linkedin_posts.length,
        total_likes,
        total_comments,
        total_shares,
        total_empathy,
        avg_engagement_per_post:
          linkedin_posts.length > 0
            ? Math.round((total_eng / linkedin_posts.length) * 10) / 10
            : 0,
        linked_count: 0,
      };

      return { linkedin_posts, content_outcomes: [], summary };
    },
    enabled: !!authorId,
    staleTime: 2 * 60 * 1000,
  });
}
