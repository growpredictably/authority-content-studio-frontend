"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  usePredefinedFrameworks,
  useImportFramework,
} from "@/lib/api/hooks/use-frameworks";
import { Loader2, BookOpen, Download, User, Tag } from "lucide-react";
import { toast } from "sonner";

interface FrameworkLibraryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authorId: string;
}

export function FrameworkLibraryDrawer({
  open,
  onOpenChange,
  authorId,
}: FrameworkLibraryDrawerProps) {
  const { data, isLoading } = usePredefinedFrameworks();
  const importMutation = useImportFramework();

  const frameworks = data?.frameworks ?? [];

  function handleImport(id: string, name: string) {
    importMutation.mutate(
      { authorId, predefinedFrameworkId: id },
      {
        onSuccess: () => {
          toast.success(`"${name}" imported`);
          onOpenChange(false);
        },
        onError: (e) => toast.error(`Import failed: ${e.message}`),
      }
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Framework Library
          </SheetTitle>
          <SheetDescription>
            Import well-known frameworks and customize them for your brand.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : frameworks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No predefined frameworks available.
            </p>
          ) : (
            frameworks.map((fw) => (
              <div
                key={fw.id}
                className="rounded-lg border p-4 space-y-2 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold">{fw.name}</h4>
                    {fw.framework_author && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <User className="h-3 w-3" />
                        {fw.framework_author}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1"
                    onClick={() => handleImport(fw.id, fw.name)}
                    disabled={importMutation.isPending}
                  >
                    {importMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Import
                  </Button>
                </div>
                {fw.purpose_overview && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {fw.purpose_overview}
                  </p>
                )}
                {fw.tags_keywords && fw.tags_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {fw.tags_keywords.map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        <Tag className="h-2.5 w-2.5 mr-0.5" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
