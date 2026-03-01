"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateUserTemplate,
  useUpdateUserTemplate,
} from "@/lib/api/hooks/use-user-templates";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { UserTemplate } from "@/lib/api/types";

const CATEGORIES = [
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

interface UserTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: UserTemplate;
  authorId: string;
}

export function UserTemplateFormDialog({
  open,
  onOpenChange,
  template,
  authorId,
}: UserTemplateFormDialogProps) {
  const isEdit = !!template;
  const createMutation = useCreateUserTemplate();
  const updateMutation = useUpdateUserTemplate();

  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [content, setContent] = useState(template?.template_content ?? "");
  const [category, setCategory] = useState(template?.category ?? "Other");

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description ?? "");
      setContent(template.template_content);
      setCategory(template.category);
    } else {
      setName("");
      setDescription("");
      setContent("");
      setCategory("Other");
    }
  }, [template]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const canSubmit = name.trim().length > 0 && content.trim().length > 0 && !isPending;

  function handleSubmit() {
    if (isEdit && template) {
      updateMutation.mutate(
        {
          templateId: template.id,
          name: name.trim(),
          description: description.trim() || undefined,
          template_content: content.trim(),
          category,
        },
        {
          onSuccess: () => {
            toast.success("Template updated");
            onOpenChange(false);
          },
          onError: (e) => toast.error(`Failed: ${e.message}`),
        }
      );
    } else {
      createMutation.mutate(
        {
          author_id: authorId,
          name: name.trim(),
          description: description.trim() || undefined,
          template_content: content.trim(),
          category,
        },
        {
          onSuccess: () => {
            toast.success("Template created");
            onOpenChange(false);
            setName("");
            setDescription("");
            setContent("");
            setCategory("Other");
          },
          onError: (e) => toast.error(`Failed: ${e.message}`),
        }
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Template" : "New Template"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="tmpl-name">Name *</Label>
            <Input
              id="tmpl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Hook Template"
            />
          </div>
          <div>
            <Label htmlFor="tmpl-desc">Description</Label>
            <Input
              id="tmpl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of when to use this template"
            />
          </div>
          <div>
            <Label htmlFor="tmpl-cat">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tmpl-content">Template Content *</Label>
            <Textarea
              id="tmpl-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your template structure here. Use [brackets] for placeholders..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
