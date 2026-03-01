import type { BrandFramework, FrameworkComponent } from "@/lib/api/types";

export const ENRICHABLE_FIELD_OPTIONS = [
  { key: "key_components", label: "Key Components", description: "New points, examples, sub-components, best practices, mistakes" },
  { key: "applications", label: "Applications", description: "New use cases and contexts" },
  { key: "implementation", label: "Implementation", description: "New implementation steps" },
  { key: "analogies", label: "Analogies", description: "New metaphors and comparisons" },
  { key: "tags", label: "Tags", description: "New keywords" },
  { key: "quote", label: "Quote", description: "New quote (only if currently empty)" },
  { key: "further_context", label: "Further Context", description: "Intellectual connections, supplementary theory, reasoning" },
] as const;

export function safeComponents(val: unknown): FrameworkComponent[] {
  if (!val) return [];
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* ignore */ }
    return [{ name: val }];
  }
  if (Array.isArray(val)) return val as FrameworkComponent[];
  return [];
}

/** Count populated fields out of the ones that matter */
export function fieldCompleteness(fw: BrandFramework): { filled: number; total: number } {
  const components = safeComponents(fw.key_components);
  const total = 7;
  let filled = 0;
  if (fw.purpose_overview) filled++;
  if (fw.unique_benefit) filled++;
  if (components.length > 0) filled++;
  if (fw.applications) filled++;
  if (fw.implementation_guidelines) filled++;
  if (fw.analogies) filled++;
  if (fw.quote) filled++;
  return { filled, total };
}
