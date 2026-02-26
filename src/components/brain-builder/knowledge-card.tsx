"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ExternalLink, ChevronDown } from "lucide-react";
import type { ExternalKnowledge } from "@/lib/api/types";

interface KnowledgeCardProps {
  item: ExternalKnowledge;
}

const endorsementStyles: Record<
  string,
  { label: string; className: string }
> = {
  full: { label: "Full", className: "bg-green-100 text-green-700" },
  partial: { label: "Partial", className: "bg-amber-100 text-amber-700" },
  anti_model: {
    label: "Anti-Model",
    className: "bg-red-100 text-red-700",
  },
  reference: {
    label: "Reference",
    className: "bg-gray-100 text-gray-700",
  },
};

export function KnowledgeCard({ item }: KnowledgeCardProps) {
  const endorsement = endorsementStyles[item.endorsement_level] ??
    endorsementStyles.reference;

  return (
    <Collapsible>
      <Card>
        <CardContent className="pt-4">
          <CollapsibleTrigger className="w-full text-left">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {item.summary}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge className={endorsement.className}>
                  {endorsement.label}
                </Badge>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {item.source_title && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <ExternalLink className="h-2.5 w-2.5" />
                  {item.source_title}
                </span>
              )}
              {item.strategic_tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[10px]"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-3 space-y-2 border-t pt-3">
            <p className="text-xs">{item.summary}</p>

            {item.key_quotes.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium">Key Quotes:</p>
                {item.key_quotes.map((q, i) => (
                  <p
                    key={i}
                    className="text-[10px] text-muted-foreground border-l-2 border-muted pl-2 italic"
                  >
                    &ldquo;{q}&rdquo;
                  </p>
                ))}
              </div>
            )}

            {item.tactical_application && (
              <div>
                <p className="text-[10px] font-medium">
                  Tactical Application:
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {item.tactical_application}
                </p>
              </div>
            )}

            {item.user_notes && (
              <div>
                <p className="text-[10px] font-medium">Your Notes:</p>
                <p className="text-[10px] text-muted-foreground">
                  {item.user_notes}
                </p>
              </div>
            )}

            {item.source_url && (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary flex items-center gap-0.5 hover:underline"
              >
                View source <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
