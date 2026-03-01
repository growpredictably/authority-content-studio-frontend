import type { ICP } from "@/lib/api/types";

export function humanize(key: string): string {
  return key
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function renderVal(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Safely normalize JSONB that might be stored as a raw string */
export function safeObject(val: unknown): Record<string, unknown> {
  if (!val) return {};
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Not valid JSON — wrap as a description
    }
    return { description: val };
  }
  if (typeof val === "object" && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }
  return {};
}

export const PARAGRAPH_KEYS = new Set([
  "description", "overview", "summary", "interests",
  "profile", "about", "background", "context",
]);

/** Count populated fields out of the ones that matter */
export function icpCompleteness(icp: ICP): { filled: number; total: number } {
  const demo = safeObject(icp.demographics);
  const total = 8;
  let filled = 0;
  if (icp.name) filled++;
  if (Object.keys(demo).length > 0) filled++;
  if (icp.previous_actions) filled++;
  if (icp.purchase_drivers) filled++;
  if (icp.frustrations) filled++;
  if (icp.aspirations) filled++;
  if (icp.before_state && Object.keys(icp.before_state).length > 0) filled++;
  if (icp.sales_filters) filled++;
  return { filled, total };
}
