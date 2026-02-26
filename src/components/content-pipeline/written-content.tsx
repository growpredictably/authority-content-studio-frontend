"use client";

import { useState } from "react";
import { usePipeline } from "@/lib/content-pipeline/pipeline-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, ChevronDown, Copy, Image } from "lucide-react";
import type {
  WritePostResponse,
  WriteArticleResponse,
  GeoScore,
  RagContext,
} from "@/lib/api/types";

export function WrittenContent() {
  const { state } = usePipeline();
  const [copied, setCopied] = useState(false);
  const [imagePromptsOpen, setImagePromptsOpen] = useState(false);
  const [ragOpen, setRagOpen] = useState(false);

  if (!state.writtenContent) return null;

  const isPost = state.contentType === "linkedin_post";
  const content = state.writtenContent;

  const body = isPost
    ? (content as WritePostResponse).final_post_body ||
      (content as WritePostResponse).post_content ||
      ""
    : (content as WriteArticleResponse).final_article_body ||
      (content as WriteArticleResponse).final_article ||
      "";

  const title = !isPost
    ? (content as WriteArticleResponse).title
    : undefined;

  const wordCount = !isPost
    ? (content as WriteArticleResponse).word_count
    : undefined;

  const geoScore = !isPost
    ? (content as WriteArticleResponse).geo_score
    : undefined;

  const imagePrompts =
    (content as WriteArticleResponse).image_prompts ||
    ((content as WritePostResponse).image_prompt
      ? [(content as WritePostResponse).image_prompt!]
      : []);

  const ragContext: RagContext | undefined =
    (content as WritePostResponse).metadata?.rag_context ||
    (content as WriteArticleResponse).rich_metadata?.rag_context ||
    (content as WriteArticleResponse).metadata?.rag_context;

  async function handleCopy() {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {title || (isPost ? "Your Post" : "Your Article")}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {isPost ? "LinkedIn Post" : state.contentType === "seo_article" ? "SEO Article" : "LinkedIn Article"}
            </Badge>
            {wordCount && (
              <Badge variant="secondary" className="text-xs">
                {wordCount.toLocaleString()} words
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-1.5"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {/* Content body */}
      <Card>
        <CardContent className="pt-6">
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {body}
          </div>
        </CardContent>
      </Card>

      {/* GEO Score for SEO articles */}
      {geoScore && <GeoScoreCard score={geoScore} />}

      {/* Image prompts */}
      {imagePrompts.length > 0 && (
        <Collapsible
          open={imagePromptsOpen}
          onOpenChange={setImagePromptsOpen}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 w-full">
              <Image className="h-3.5 w-3.5" />
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  imagePromptsOpen && "rotate-180"
                )}
              />
              Image Prompts ({imagePrompts.length})
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {imagePrompts.map((prompt, idx) => (
              <Card key={idx}>
                <CardContent className="pt-3 pb-2">
                  <p className="text-xs text-muted-foreground">{prompt}</p>
                </CardContent>
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* RAG debug */}
      {ragContext && (
        <Collapsible open={ragOpen} onOpenChange={setRagOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 w-full">
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  ragOpen && "rotate-180"
                )}
              />
              RAG Context
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Card>
              <CardContent className="pt-3 pb-2 space-y-1 text-xs">
                <p>
                  <span className="text-muted-foreground">Retrieved: </span>
                  {ragContext.retrieved_count} items
                </p>
                <p>
                  <span className="text-muted-foreground">Categories: </span>
                  {ragContext.categories_found.join(", ") || "None"}
                </p>
                <p>
                  <span className="text-muted-foreground">
                    Top similarity:{" "}
                  </span>
                  {(ragContext.top_similarity * 100).toFixed(1)}%
                </p>
                {ragContext.error && (
                  <p className="text-destructive">Error: {ragContext.error}</p>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function GeoScoreCard({ score }: { score: GeoScore }) {
  const metrics = [
    {
      label: "GE Visibility",
      value: score.generative_engine_visibility,
    },
    { label: "Content Depth", value: score.content_depth },
    { label: "Authority Signals", value: score.authority_signals },
    { label: "Overall", value: score.overall_score },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">GEO Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{m.label}</span>
              <span className="font-medium">
                {Math.round(m.value * 100)}%
              </span>
            </div>
            <Progress value={m.value * 100} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
