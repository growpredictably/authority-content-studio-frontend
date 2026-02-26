"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { LinkedInExperience } from "@/lib/api/types";
import { useUpdateBrandMapping } from "@/lib/api/hooks/use-optimizer";

const CONTEXT_OPTIONS = [
  { value: "corporate", label: "Corporate" },
  { value: "venture", label: "Venture" },
  { value: "legacy", label: "Legacy" },
  { value: "shared", label: "Shared" },
];

interface BrandMapperProps {
  experiences: LinkedInExperience[];
  authorId: string;
  initialMapping?: Record<string, string>;
}

export function BrandMapper({
  experiences,
  authorId,
  initialMapping = {},
}: BrandMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    experiences.forEach((exp) => {
      initial[exp.company] =
        initialMapping[exp.company] || exp.persona_tag || "shared";
    });
    return initial;
  });

  const updateMapping = useUpdateBrandMapping();

  function handleSave() {
    updateMapping.mutate(
      { authorId, mapping },
      {
        onSuccess: () => toast.success("Brand mapping saved"),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to save mapping"
          ),
      }
    );
  }

  // Deduplicate companies
  const uniqueCompanies = Array.from(
    new Map(experiences.map((e) => [e.company, e])).values()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Brand Context Mapping</CardTitle>
        <p className="text-sm text-muted-foreground">
          Assign each company to a brand context. This controls fence-post
          guardrails that prevent cross-context contamination in suggestions.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {uniqueCompanies.map((exp) => (
          <div
            key={exp.company}
            className="flex items-center justify-between gap-4 rounded-lg border p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{exp.company}</p>
              <p className="text-xs text-muted-foreground truncate">
                {exp.title}
              </p>
            </div>
            <Select
              value={mapping[exp.company] || "shared"}
              onValueChange={(value) =>
                setMapping((prev) => ({ ...prev, [exp.company]: value }))
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTEXT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        <Button
          onClick={handleSave}
          disabled={updateMapping.isPending}
          className="w-full gap-2"
        >
          {updateMapping.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Mapping
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
