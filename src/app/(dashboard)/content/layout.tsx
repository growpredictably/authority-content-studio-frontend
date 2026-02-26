"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PipelineProvider } from "@/lib/content-pipeline/pipeline-context";
import { StepIndicator } from "@/components/content-pipeline/step-indicator";

export default function ContentLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDrafts = pathname === "/content/drafts";

  if (isDrafts) {
    return <>{children}</>;
  }

  return (
    <PipelineProvider>
      <div className="space-y-6">
        <StepIndicator />
        {children}
      </div>
    </PipelineProvider>
  );
}
