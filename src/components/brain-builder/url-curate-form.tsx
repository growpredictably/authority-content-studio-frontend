"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Globe, Loader2, Search } from "lucide-react";

interface UrlCurateFormProps {
  onCurate: (url: string) => void;
  isCurating: boolean;
}

export function UrlCurateForm({ onCurate, isCurating }: UrlCurateFormProps) {
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (url.trim()) onCurate(url.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="brain-url" className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          Add to Brain
        </Label>
        <div className="flex gap-2">
          <Input
            id="brain-url"
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!url.trim() || isCurating}
            className="gap-1.5 shrink-0"
          >
            {isCurating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {isCurating ? "Curating..." : "Curate"}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Paste any article, research paper, or blog post URL. The system will
          extract Strategic Knowledge Blocks for your review.
        </p>
      </div>
    </form>
  );
}
