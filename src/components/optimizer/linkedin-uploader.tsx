"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ParsedLinkedInProfile } from "@/lib/api/types";
import { useParseLinkedInPdf } from "@/lib/api/hooks/use-optimizer";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface LinkedInUploaderProps {
  authorId: string;
  brandId?: string;
  onProfileParsed: (profile: ParsedLinkedInProfile) => void;
}

export function LinkedInUploader({
  authorId,
  brandId,
  onProfileParsed,
}: LinkedInUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const parseMutation = useParseLinkedInPdf();

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Please upload a PDF file");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File must be under 10MB");
        return;
      }

      parseMutation.mutate(
        { file, authorId, brandId },
        {
          onSuccess: (profile) => {
            toast.success("LinkedIn profile parsed successfully");
            onProfileParsed(profile);
          },
          onError: (err) => {
            toast.error(
              err instanceof Error ? err.message : "Failed to parse PDF"
            );
          },
        }
      );
    },
    [authorId, brandId, parseMutation, onProfileParsed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        parseMutation.isPending && "pointer-events-none opacity-60"
      )}
    >
      {parseMutation.isPending ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Parsing your LinkedIn profile...
          </p>
        </>
      ) : (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {isDragging ? (
              <FileText className="h-8 w-8 text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragging
                ? "Drop your PDF here"
                : "Drag and drop your LinkedIn PDF"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use LinkedIn's "Save to PDF" feature. Max 10MB.
            </p>
          </div>
          <label>
            <Button variant="outline" size="sm" asChild>
              <span>Browse Files</span>
            </Button>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </>
      )}
    </div>
  );
}
