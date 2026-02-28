"use client";

import { useAuthor } from "@/hooks/use-author";
import { useAuthors, useSetPrimaryAuthor } from "@/lib/api/hooks/use-authors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { User, ChevronDown, Check } from "lucide-react";

export function AuthorSelector() {
  const { author } = useAuthor();
  const { data: authorsData } = useAuthors();
  const setPrimary = useSetPrimaryAuthor();
  const authors = authorsData?.authors ?? [];
  const hasMultiple = authors.length > 1;

  if (!author) return null;

  if (!hasMultiple) {
    return (
      <Badge variant="secondary" className="gap-1.5 text-xs font-normal py-1 px-2.5">
        <User className="h-3 w-3" />
        {author.name}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent transition-colors">
          <User className="h-3 w-3" />
          {author.name}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {authors.map((a) => (
          <DropdownMenuItem
            key={a.id}
            onClick={() => {
              if (a.id !== author.id) setPrimary.mutate(a.id);
            }}
            className="gap-2 text-xs"
          >
            {a.id === author.id ? (
              <Check className="h-3 w-3 text-primary" />
            ) : (
              <span className="w-3" />
            )}
            <span className={a.id === author.id ? "font-medium" : ""}>
              {a.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
