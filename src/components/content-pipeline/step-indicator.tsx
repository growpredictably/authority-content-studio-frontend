"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePipeline } from "@/lib/content-pipeline/pipeline-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileText, BookOpen, PenTool, RotateCcw } from "lucide-react";

const steps = [
  { key: "angles" as const, label: "Angles", href: "/content/angles", icon: FileText },
  { key: "outline" as const, label: "Outline", href: "/content/outline", icon: BookOpen },
  { key: "write" as const, label: "Write", href: "/content/write", icon: PenTool },
];

const stepOrder = { angles: 0, outline: 1, write: 2 };

export function StepIndicator() {
  const pathname = usePathname();
  const { currentMaxStep, reset } = usePipeline();

  const maxIdx = stepOrder[currentMaxStep];

  return (
    <div className="flex items-center gap-2">
      <nav className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
        {steps.map((step, idx) => {
          const isActive = pathname === step.href;
          const isReachable = idx <= maxIdx;
          const Icon = step.icon;

          const content = (
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : isReachable
                    ? "text-muted-foreground hover:text-foreground cursor-pointer"
                    : "text-muted-foreground/40 cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : idx < maxIdx
                      ? "bg-primary/20 text-primary"
                      : "bg-muted-foreground/20 text-muted-foreground"
                )}
              >
                {idx + 1}
              </span>
              <Icon className="h-3.5 w-3.5 hidden sm:block" />
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          );

          if (isReachable && !isActive) {
            return (
              <Link key={step.key} href={step.href}>
                {content}
              </Link>
            );
          }

          return <div key={step.key}>{content}</div>;
        })}
      </nav>

      <Button
        variant="ghost"
        size="sm"
        onClick={reset}
        className="ml-auto gap-1 text-muted-foreground"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Start Over</span>
      </Button>
    </div>
  );
}
