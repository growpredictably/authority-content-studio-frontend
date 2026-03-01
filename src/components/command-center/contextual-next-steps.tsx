"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, PenTool, Brain, Mic, Radar, Users } from "lucide-react";
import Link from "next/link";
import { useLeverage, useAuthorityScore } from "@/lib/api/hooks/use-command-center";

interface NextStep {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

interface ContextualNextStepsProps {
  authorId: string;
}

export function ContextualNextSteps({ authorId }: ContextualNextStepsProps) {
  const { data: leverage, isLoading: leverageLoading } = useLeverage(authorId);
  const { data: score, isLoading: scoreLoading } = useAuthorityScore(authorId);

  if (leverageLoading || scoreLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const steps: NextStep[] = [];

  // Priority 1: Strengthen packets if calibrating
  if (leverage && (leverage.metrics.calibrating_packets > 0 || leverage.metrics.draft_themes > 0)) {
    steps.push({
      label: "Strengthen Packets",
      description: `${leverage.metrics.calibrating_packets} packet${leverage.metrics.calibrating_packets !== 1 ? "s" : ""} ready to improve`,
      href: "/authority/gaps",
      icon: Target,
      accent: "text-red-600",
    });
  }

  // Priority 2: Write a post if ready packets exist
  if (leverage && leverage.metrics.ready_packets > 0) {
    steps.push({
      label: "Write a Post",
      description: "Your DNA can fuel unique content",
      href: "/content/angles",
      icon: PenTool,
      accent: "text-blue-600",
    });
  }

  // Priority 3: Build brain if low
  if (leverage && leverage.metrics.external_knowledge_count < 5) {
    steps.push({
      label: "Build Your Brain",
      description: "Add external sources to strengthen your authority",
      href: "/brain",
      icon: Brain,
      accent: "text-orange-600",
    });
  }

  // Priority 4: Voice builder if brain depth is low (score breakdown)
  if (score) {
    const brainDepth = score.breakdown.find((b) => b.category === "Brain Depth");
    const dnaDepth = score.breakdown.find((b) => b.category === "DNA Depth");
    if (dnaDepth && dnaDepth.score < dnaDepth.max_score * 0.5 && steps.length < 3) {
      steps.push({
        label: "Train Your Voice",
        description: "Record more DNA to deepen your authority",
        href: "/voice",
        icon: Mic,
        accent: "text-cyan-600",
      });
    }
    if (brainDepth && brainDepth.score < brainDepth.max_score * 0.3 && steps.length < 3) {
      steps.push({
        label: "Build Your Brain",
        description: "External knowledge strengthens your positioning",
        href: "/brain",
        icon: Brain,
        accent: "text-orange-600",
      });
    }
  }

  // Fill remaining spots with rotating explore options
  const explorOptions: NextStep[] = [
    {
      label: "Scan for Evidence",
      description: "Find stats and studies that support your beliefs",
      href: "/authority/evidence",
      icon: Radar,
      accent: "text-violet-600",
    },
    {
      label: "Review ICPs",
      description: "Refine your ideal customer profiles",
      href: "/authority/icps",
      icon: Users,
      accent: "text-emerald-600",
    },
  ];

  // Deduplicate by href
  const usedHrefs = new Set(steps.map((s) => s.href));
  for (const option of explorOptions) {
    if (steps.length >= 3) break;
    if (!usedHrefs.has(option.href)) {
      steps.push(option);
      usedHrefs.add(option.href);
    }
  }

  // Take at most 3
  const finalSteps = steps.slice(0, 3);

  if (finalSteps.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">What to do next</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {finalSteps.map((step) => (
          <Link key={step.href} href={step.href}>
            <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <step.icon
                    className={`h-4 w-4 ${step.accent} group-hover:scale-110 transition-transform`}
                  />
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
