"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, LayoutTemplate, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTemplates } from "@/lib/api/hooks/use-templates";
import { useUserTemplates } from "@/lib/api/hooks/use-user-templates";
import type { LinkedInPostTemplate, UserTemplate } from "@/lib/api/types";

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
  "Other": "bg-gray-100 text-gray-700 border-gray-200",
};

const QUICK_CATEGORIES = [
  "All",
  "Copywriting Formulas",
  "Story-based",
  "Authority Building",
  "Lists & How-To",
  "Engagement & Questions",
];

type SelectedTemplate = {
  template_name: string;
  template_content: string;
  rationale?: string;
};

interface TemplateGalleryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: SelectedTemplate) => void;
  authorId?: string;
  selectedTemplateName?: string;
}

export function TemplateGalleryDrawer({
  open,
  onOpenChange,
  onSelect,
  authorId,
  selectedTemplateName,
}: TemplateGalleryDrawerProps) {
  const [tab, setTab] = useState<"system" | "mine">("system");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const { data: systemData, isLoading: systemLoading } = useTemplates();
  const { data: userData, isLoading: userLoading } = useUserTemplates(authorId);

  const isLoading = tab === "system" ? systemLoading : userLoading;

  // Filter system templates
  const systemTemplates = (systemData?.templates ?? []).filter((t) => {
    if (category !== "All" && t.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Filter user templates
  const userTemplates = (userData?.templates ?? []).filter((t) => {
    if (category !== "All" && t.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  function handleSelect(name: string, content: string) {
    onSelect({
      template_name: name,
      template_content: content,
      rationale: "Selected from template gallery",
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Browse Templates
          </SheetTitle>
          <SheetDescription>
            Select a template to guide your post structure.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          {/* Tab toggle */}
          <div className="flex gap-1 rounded-lg border p-1">
            <button
              onClick={() => setTab("system")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === "system"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              System ({systemData?.total ?? 0})
            </button>
            <button
              onClick={() => setTab("mine")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === "mine"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              My Templates ({userData?.total ?? 0})
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Quick category pills */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                  category === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted border-border"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Template list */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : tab === "system" ? (
            systemTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No templates match your search.
              </p>
            ) : (
              <div className="space-y-2">
                {systemTemplates.map((t) => {
                  const isSelected = selectedTemplateName === t.name;
                  return (
                    <DrawerTemplateCard
                      key={t.id}
                      name={t.name}
                      description={t.description}
                      category={t.category}
                      isSelected={isSelected}
                      onSelect={() => handleSelect(t.name, t.template_content)}
                    />
                  );
                })}
              </div>
            )
          ) : userTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No custom templates yet.
            </p>
          ) : (
            <div className="space-y-2">
              {userTemplates.map((t) => {
                const isSelected = selectedTemplateName === t.name;
                return (
                  <DrawerTemplateCard
                    key={t.id}
                    name={t.name}
                    description={t.description ?? t.template_content.slice(0, 100)}
                    category={t.category}
                    isSelected={isSelected}
                    onSelect={() => handleSelect(t.name, t.template_content)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DrawerTemplateCard({
  name,
  description,
  category,
  isSelected,
  onSelect,
}: {
  name: string;
  description: string;
  category: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const colorClass =
    CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <Card
      className={`cursor-pointer transition-all hover:border-primary/50 ${
        isSelected ? "border-primary ring-1 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <CardContent className="pt-3 pb-2 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge className={`text-[9px] shrink-0 border ${colorClass}`}>
              {category}
            </Badge>
            <p className="text-sm font-medium truncate">{name}</p>
          </div>
          {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
