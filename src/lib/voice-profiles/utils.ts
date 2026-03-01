import { SECTION_KEYS } from "./constants";

export function countItems(val: unknown): number {
  if (Array.isArray(val)) return val.length;
  if (typeof val === "object" && val) return Object.keys(val).length;
  return val ? 1 : 0;
}

export function calculateCompleteness(author: Record<string, unknown>) {
  const filled = SECTION_KEYS.filter(
    (key) => countItems(author[key]) > 0
  ).length;
  return {
    filled,
    total: SECTION_KEYS.length,
    percent: Math.round((filled / SECTION_KEYS.length) * 100),
  };
}

export function getTotalItemCount(author: Record<string, unknown>): number {
  return SECTION_KEYS.reduce(
    (sum, key) => sum + countItems(author[key]),
    0
  );
}

export function getStatusBadge(status: string | undefined): {
  label: string;
  emoji: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  color: string;
} {
  if (status === "active" || status === "done") {
    return { label: "Trained", emoji: "\u2705", variant: "default", color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400" };
  }
  if (status === "error") {
    return { label: "Error", emoji: "\u26A0\uFE0F", variant: "destructive", color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400" };
  }
  return { label: "Untrained", emoji: "\u23F3", variant: "secondary", color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" };
}
