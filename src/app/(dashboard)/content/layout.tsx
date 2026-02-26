"use client";

import type { ReactNode } from "react";
import { PipelineProvider } from "@/lib/content-pipeline/pipeline-context";
import { StepIndicator } from "@/components/content-pipeline/step-indicator";

export default function ContentLayout({ children }: { children: ReactNode }) {
  return (
    <PipelineProvider>
      <div className="space-y-6">
        <StepIndicator />
        {children}
      </div>
    </PipelineProvider>
  );
}
