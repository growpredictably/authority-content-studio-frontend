"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  LayoutTemplate,
  Search,
  Plus,
  Copy,
  Pencil,
  Trash2,
} from "lucide-react";
import { useTemplates } from "@/lib/api/hooks/use-templates";
import {
  useUserTemplates,
  useDeleteUserTemplate,
  useDuplicateTemplate,
} from "@/lib/api/hooks/use-user-templates";
import { useAuthor } from "@/hooks/use-author";
import { UserTemplateFormDialog } from "@/components/templates/user-template-form-dialog";
import { toast } from "sonner";
import type { LinkedInPostTemplate, UserTemplate } from "@/lib/api/types";

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
  "Other",
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
  "Other": "bg-gray-100 text-gray-700 border-gray-200",
};

type Tab = "system" | "mine";

export default function TemplatesPage() {
  const { author } = useAuthor();
  const [tab, setTab] = useState<Tab>("system");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<UserTemplate | undefined>();

  const apiCategory = selectedCategory === "All Templates" ? undefined : selectedCategory;
  const { data: systemData, isLoading: systemLoading } = useTemplates(apiCategory);
  const { data: userData, isLoading: userLoading } = useUserTemplates(author?.id);
  const deleteMutation = useDeleteUserTemplate();
  const duplicateMutation = useDuplicateTemplate();

  const isLoading = tab === "system" ? systemLoading : userLoading;

  // System templates
  const systemTemplates = systemData?.templates ?? [];
  const filteredSystem = searchQuery
    ? systemTemplates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : systemTemplates;

  // User templates
  const allUserTemplates = userData?.templates ?? [];
  const filteredUser = (() => {
    let list = allUserTemplates;
    if (apiCategory) list = list.filter((t) => t.category === apiCategory);
    if (searchQuery) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return list;
  })();

  // Category counts (for system tab when showing all)
  const categoryCounts: Record<string, number> = {};
  if (!apiCategory && systemData) {
    for (const t of systemData.templates) {
      categoryCounts[t.category] = (categoryCounts[t.category] ?? 0) + 1;
    }
  }

  const totalCount =
    tab === "system" ? (systemData?.total ?? 0) : allUserTemplates.length;
  const shownCount = tab === "system" ? filteredSystem.length : filteredUser.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutTemplate className="h-7 w-7" />
          <div>
            <h1 className="text-2xl font-bold">Post Templates</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} templates for high-engagement LinkedIn posts
            </p>
          </div>
        </div>
        {tab === "mine" && author && (
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Template
          </Button>
        )}
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 rounded-lg border p-1 w-fit">
        <button
          onClick={() => setTab("system")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "system"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted text-muted-foreground"
          }`}
        >
          System Templates
        </button>
        <button
          onClick={() => setTab("mine")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "mine"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted text-muted-foreground"
          }`}
        >
          My Templates ({allUserTemplates.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates by name or description..."
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
          const count = isAll ? totalCount : categoryCounts[cat];

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
              {count !== undefined && tab === "system" && ` (${count})`}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {shownCount} of {totalCount} templates
      </p>

      {/* Templates grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : tab === "system" ? (
        filteredSystem.length === 0 ? (
          <EmptyState message="No system templates found." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSystem.map((t) => (
              <SystemTemplateCard
                key={t.id}
                template={t}
                onDuplicate={() => {
                  if (!author) return;
                  duplicateMutation.mutate(
                    { templateId: String(t.id), authorId: author.id, sourceType: "system" },
                    {
                      onSuccess: () => toast.success(`"${t.name}" duplicated to My Templates`),
                      onError: (e) => toast.error(e.message),
                    }
                  );
                }}
              />
            ))}
          </div>
        )
      ) : filteredUser.length === 0 ? (
        <EmptyState message="No custom templates yet. Create one or duplicate a system template." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUser.map((t) => (
            <UserTemplateCard
              key={t.id}
              template={t}
              onEdit={() => setEditTemplate(t)}
              onDuplicate={() => {
                if (!author) return;
                duplicateMutation.mutate(
                  { templateId: t.id, authorId: author.id, sourceType: "user" },
                  {
                    onSuccess: () => toast.success("Template duplicated"),
                    onError: (e) => toast.error(e.message),
                  }
                );
              }}
              onDelete={() => {
                deleteMutation.mutate(t.id, {
                  onSuccess: () => toast.success(`"${t.name}" deleted`),
                  onError: (e) => toast.error(e.message),
                });
              }}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      {author && (
        <UserTemplateFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          authorId={author.id}
        />
      )}
      {editTemplate && author && (
        <UserTemplateFormDialog
          key={editTemplate.id}
          open={!!editTemplate}
          onOpenChange={(v) => { if (!v) setEditTemplate(undefined); }}
          template={editTemplate}
          authorId={author.id}
        />
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 space-y-3">
      <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground/40" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function SystemTemplateCard({
  template,
  onDuplicate,
}: {
  template: LinkedInPostTemplate;
  onDuplicate: () => void;
}) {
  const colorClass =
    CATEGORY_COLORS[template.category] ?? "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <Card className="group flex flex-col relative">
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
      <button
        onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-1.5 hover:bg-muted"
        title="Duplicate to My Templates"
      >
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </Card>
  );
}

function UserTemplateCard({
  template,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  template: UserTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const colorClass =
    CATEGORY_COLORS[template.category] ?? "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <Card className="group flex flex-col relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge className={`text-[10px] shrink-0 border ${colorClass}`}>
            {template.category}
          </Badge>
        </div>
        <CardTitle className="text-sm leading-snug mt-1">
          {template.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-xs text-muted-foreground line-clamp-3">
          {template.description || template.template_content}
        </p>
      </CardContent>
      <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="rounded-md p-1.5 hover:bg-muted"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="rounded-md p-1.5 hover:bg-muted"
          title="Duplicate"
        >
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="rounded-md p-1.5 hover:bg-muted"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>
    </Card>
  );
}
