// DNA section definitions matching the voice-profiles-system-contract.md
export const DNA_SECTIONS = [
  { key: "tone", label: "Tone", icon: "Settings", color: "purple", element: "tone" },
  { key: "quotes", label: "Quotes", icon: "Quote", color: "blue", element: "quotes" },
  { key: "stories", label: "Stories", icon: "BookOpen", color: "emerald", element: "stories" },
  { key: "knowledge", label: "Internal Knowledge", icon: "Brain", color: "orange", element: "internal_knowledge" },
  { key: "experience", label: "Experience", icon: "Award", color: "amber", element: "experience" },
  { key: "perspectives", label: "Perspectives", icon: "Lightbulb", color: "yellow", element: "perspectives" },
  { key: "preferences", label: "Preferences", icon: "SlidersHorizontal", color: "slate", element: "preferences" },
  { key: "frameworks", label: "Frameworks", icon: "Layers", color: "rose", element: "frameworks" },
] as const;

// All synthesis element names (used for exclude array)
export const ALL_SYNTHESIS_ELEMENTS = [
  "stories",
  "tone",
  "perspectives",
  "internal_knowledge",
  "experience",
  "quotes",
  "preferences",
  "external_knowledge",
  "frameworks",
] as const;

// DB column name <-> synthesis element name mapping
// Most are 1:1 except knowledge <-> internal_knowledge
export const ELEMENT_TO_DB_COLUMN: Record<string, string> = {
  internal_knowledge: "knowledge",
};

export const DB_COLUMN_TO_ELEMENT: Record<string, string> = {
  knowledge: "internal_knowledge",
};

// Map section key (DB column) to synthesis element name
export const SECTION_TO_ELEMENT: Record<string, string> = {
  tone: "tone",
  stories: "stories",
  perspectives: "perspectives",
  quotes: "quotes",
  knowledge: "internal_knowledge",
  experience: "experience",
  preferences: "preferences",
  frameworks: "frameworks",
};

// Section keys used for completeness calculation
export const SECTION_KEYS = [
  "tone",
  "quotes",
  "stories",
  "knowledge",
  "experience",
  "perspectives",
  "preferences",
  "frameworks",
] as const;
