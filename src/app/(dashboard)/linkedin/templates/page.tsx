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
import { Input } from "@/components/ui/input";
import { LayoutTemplate, Search } from "lucide-react";
import { useTemplates } from "@/lib/api/hooks/use-templates";
import type { LinkedInPostTemplate } from "@/lib/api/types";

const CATEGORIES = [
  "All Templates",
  "Copywriting Formulas",
  "Story-based",
  "Authority Building",
  "Contrast & Comparison",
  "Lists & How-To",
  "Engagement & Questions",
  "Social Proof",
  "Provocative & Bold",
  "Personal & Vulnerable",
  "Career Growth",
  "Case Study",
  "How-To",
  "Inspiration",
  "Storytelling",
  "Thought Leadership",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Copywriting Formulas": "bg-blue-100 text-blue-700 border-blue-200",
  "Story-based": "bg-green-100 text-green-700 border-green-200",
  "Authority Building": "bg-purple-100 text-purple-700 border-purple-200",
  "Contrast & Comparison": "bg-orange-100 text-orange-700 border-orange-200",
  "Lists & How-To": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Engagement & Questions": "bg-teal-100 text-teal-700 border-teal-200",
  "Social Proof": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Provocative & Bold": "bg-red-100 text-red-700 border-red-200",
  "Personal & Vulnerable": "bg-pink-100 text-pink-700 border-pink-200",
  "Career Growth": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Case Study": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "How-To": "bg-amber-100 text-amber-700 border-amber-200",
  "Inspiration": "bg-rose-100 text-rose-700 border-rose-200",
  "Storytelling": "bg-lime-100 text-lime-700 border-lime-200",
  "Thought Leadership": "bg-violet-100 text-violet-700 border-violet-200",
};

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All Templates");
  const [searchQuery, setSearchQuery] = useState("");

  const apiCategory = selectedCategory === "All Templates" ? undefined : selectedCategory;
  const { data, isLoading } = useTemplates(apiCategory);

  const templates = data?.templates ?? [];

  // Client-side search filter
  const filtered = searchQuery
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : templates;

  // Count templates per category (only when showing all)
  const categoryCounts: Record<string, number> = {};
  if (!apiCategory && data) {
    for (const t of data.templates) {
      categoryCounts[t.category] = (categoryCounts[t.category] ?? 0) + 1;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LayoutTemplate className="h-7 w-7" />
        <div>
          <h1 className="text-2xl font-bold">Post Templates</h1>
          <p className="text-sm text-muted-foreground">
            {data?.total ?? 0} templates for high-engagement LinkedIn posts
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates by name, description, or content..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const isAll = cat === "All Templates";
          const isActive = cat === selectedCategory;
          const count = isAll ? data?.total : categoryCounts[cat];

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted border-border"
              }`}
            >
              {cat}
              {count !== undefined && ` (${count})`}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {data?.total ?? 0} templates
      </p>

      {/* Templates grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">No templates found.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: LinkedInPostTemplate }) {
  const colorClass =
    CATEGORY_COLORS[template.category] ?? "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge className={`text-[10px] shrink-0 border ${colorClass}`}>
            {template.category}
          </Badge>
          <span className="text-xs text-muted-foreground">
            #{template.template_number}
          </span>
        </div>
        <CardTitle className="text-sm leading-snug mt-1">
          {template.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-xs text-muted-foreground line-clamp-3">
          {template.description}
        </p>
      </CardContent>
    </Card>
  );
}
