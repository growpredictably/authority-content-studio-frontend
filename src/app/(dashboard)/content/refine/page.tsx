"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePipeline } from "@/lib/content-pipeline/pipeline-context";
import { useAutoSave } from "@/lib/content-pipeline/use-auto-save";
import { AuthorSelector } from "@/components/shared/author-selector";
import { RefineIngredients } from "@/components/content-pipeline/refine-ingredients";
import { SlidersHorizontal } from "lucide-react";

export default function RefinePage() {
  const router = useRouter();
  const { state, setApprovedContext } = usePipeline();
  useAutoSave();

  // Guard: redirect if no selected angle
  useEffect(() => {
    if (!state.selectedAngle) {
      router.replace("/content/angles");
    }
  }, [state.selectedAngle, router]);

  function handleApprove(approvedContext: Parameters<typeof setApprovedContext>[0]) {
    setApprovedContext(approvedContext);
    router.push("/content/outline");
  }

  if (!state.selectedAngle) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Refine Ingredients</h2>
        <AuthorSelector />
      </div>

      <RefineIngredients onApprove={handleApprove} />
    </div>
  );
}
