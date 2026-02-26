"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutTemplate, ArrowRight, Hash } from "lucide-react";
import { useTemplates } from "@/lib/api/hooks/use-templates";
import type { StructureArchetype } from "@/lib/api/types";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  linkedin_post: "LinkedIn Post",
  linkedin_article: "LinkedIn Article",
  seo_article: "SEO Article",
};

export default function TemplatesPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { data, isLoading } = useTemplates(filter);

  const templates = data?.templates ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Content Templates</h1>
        {data && (
          <span className="text-sm text-muted-foreground">
            ({data.total})
          </span>
        )}
      </div>

      <Tabs
        value={filter ?? "all"}
        onValueChange={(v) => setFilter(v === "all" ? undefined : v)}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="linkedin_post">LinkedIn Post</TabsTrigger>
          <TabsTrigger value="linkedin_article">LinkedIn Article</TabsTrigger>
          <TabsTrigger value="seo_article">SEO Article</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">No templates found.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: StructureArchetype }) {
  const steps = template.blueprint.split("->").map((s) => s.trim());

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm leading-snug">
            {template.type}
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {CONTENT_TYPE_LABELS[template.content_type] ?? template.content_type}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{template.description}</p>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {/* Blueprint flow */}
        <div className="flex flex-wrap items-center gap-1">
          {steps.map((step, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                {step}
              </span>
              {i < steps.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
              )}
            </span>
          ))}
        </div>

        {/* Tags + usage */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {(template.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
              >
                <Hash className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
          {template.usage_count > 0 && (
            <span className="text-[10px] text-muted-foreground">
              Used {template.usage_count}x
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
