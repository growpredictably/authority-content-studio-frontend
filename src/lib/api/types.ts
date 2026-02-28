/** Standard identifiers required in ALL API payloads */
export interface ApiIdentifiers {
  user_id: string;
  author_id: string;
  author_name: string;
  brand_id: string;
}

/** Optional additional context for API calls */
export interface ApiContext {
  archetype?: string;
  archetype_description?: string;
  brand_name?: string;
  packet_id?: string;
}

/** Health check response */
export interface HealthResponse {
  status: string;
  platform: string;
  version: string;
}

/** Author record from authors_dna table */
export interface Author {
  id: string;
  user_id: string;
  name: string;
  brand_id?: string;
  brand_name?: string;
  archetype?: string;
  archetype_description?: string;
}

/** Standard error shape from the backend */
export interface BackendError {
  error: string;
  message: string;
  details?: string;
}

// ─── Optimizer Types ─────────────────────────────────────────────

export interface LinkedInExperience {
  id: string;
  title: string;
  company: string;
  date_range: string;
  description: string;
  persona_tag?: "corporate" | "venture" | "legacy";
  status?: "active" | "archive";
}

export interface ParsedLinkedInProfile {
  headline: string | null;
  about: string | null;
  experiences: LinkedInExperience[];
  skills: string[];
  raw_text: string;
}

export interface OptimizationSuggestion {
  id?: string;
  section: string;
  current_text: string;
  proposed_text: string;
  reasoning: string;
  confidence: number;
  drift_score: number;
  research_sources?: string[];
  rationale_summary?: string;
}

export interface PositioningGap {
  gap: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
  authority_signal: string;
}

export interface SuggestResponse {
  success: boolean;
  suggestions: OptimizationSuggestion[];
  positioning_gaps?: PositioningGap[];
}

export interface DriftScanRequest {
  author_id: string;
  brand_id?: string;
  source_content: string;
  target_section_name: string;
  enrichment_context?: string;
  persona_tag?: "corporate" | "venture" | "legacy";
  persona_goal?: string;
  enable_research?: boolean;
}

// ─── Command Center Types ──────────────────────────────────────

export interface ScoreBreakdown {
  category: string;
  score: number;
  max_score: number;
  raw_value: string;
  improvement_tip: string;
}

export interface AuthorityScoreResponse {
  success: boolean;
  author_id: string;
  total_score: number;
  score_band: "red" | "orange" | "yellow" | "green";
  breakdown: ScoreBreakdown[];
  generated_at: string;
}

export interface SyncAction {
  action_id: string;
  action_type: "sync" | "clarify" | "decide";
  priority: number;
  headline: string;
  description: string;
  prompt: string;
  theme?: string;
  packet_id?: string;
  element_a?: Record<string, unknown>;
  element_b?: Record<string, unknown>;
  gap_type?: string;
  expected_impact?: string;
  rationale?: string;
  effort_minutes?: number;
  impact_delta?: { before: number; after: number } | null;
}

export interface HabitStats {
  author_id: string;
  current_streak: number;
  longest_streak: number;
  last_sync_at?: string;
  total_syncs: number;
  total_actions_taken: number;
  sync_actions_taken: number;
  clarify_actions_taken: number;
  decide_actions_taken: number;
  streak_status: "active" | "at_risk" | "broken" | "none";
  hours_until_streak_break?: number;
}

export interface DailySyncResponse {
  success: boolean;
  author_id: string;
  session_id: string;
  actions: SyncAction[];
  habit_stats: HabitStats;
  greeting: string;
  generated_at: string;
}

export interface ActionCompleteRequest {
  author_id: string;
  action_id: string;
  session_id: string;
  result: "accepted" | "rejected" | "skipped";
  user_response?: Record<string, unknown>;
}

export interface ActionCompleteResponse {
  success: boolean;
  action_id: string;
  result: string;
  habit_stats: HabitStats;
  message: string;
}

export interface LeverageMetrics {
  ready_packets: number;
  calibrating_packets: number;
  draft_themes: number;
  external_knowledge_count: number;
  potential_articles: number;
  potential_posts: number;
  total_potential_content: number;
  brain_by_endorsement: Record<string, number>;
  leverage_message: string;
}

export interface LeverageResponse {
  success: boolean;
  author_id: string;
  metrics: LeverageMetrics;
  packet_flow: { total_packets: number; by_stage: Record<string, number> };
  generated_at: string;
}

// ─── Content Pipeline Types ────────────────────────────────────

export type ContentStrategy =
  | "linkedin_posts"
  | "MarketAnalysis"
  | "YouTube";

export type PipelineContentType =
  | "linkedin_post"
  | "linkedin_article"
  | "seo_article";

export interface ContentAngle {
  angle_id?: string;
  title: string;
  angle_title?: string;
  content_type?: string;
  target_audience?: string;
  target_metric?: string;
  strategic_brief?: string;
  constraint_type?: string;
  differentiation_score?: number;
  strategic_passes?: number;
  hook?: string;
  strategic_rationale?: string;
  icp_alignment?: string;
  summary?: string;
}

export interface AnglesContext {
  key_insights?: Array<{
    id: string;
    headline: string;
    description: string;
    source_quote?: string;
    selected?: boolean;
  }>;
  stories?: unknown[];
  frameworks?: unknown[];
  quotes?: unknown[];
  experience?: unknown[];
  perspectives?: unknown[];
  knowledge?: unknown[];
  external_knowledge?: unknown[];
  matrix_library?: unknown[];
  icp_pains?: unknown[];
  icp_profile?: Record<string, unknown>;
  tone?: Record<string, unknown>;
}

export interface GetAnglesResponse {
  selected_angles: ContentAngle[];
  context: AnglesContext;
  session_record_id: string;
  tracking_id?: string;
  packet_used?: string;
}

export interface OutlineHook {
  id?: string;
  text: string;
  type?: string;
  hook_type?: string;
  rationale?: string;
}

export interface OutlineSection {
  heading?: string;
  section_type?: string;
  key_points?: string[];
  content?: string;
  purpose?: string;
  talking_points?: string[];
  estimated_word_count?: number;
}

export interface SupportingEvidence {
  url?: string;
  title?: string;
  snippet?: string;
  stat_summary?: string;
  content?: string;
  source?: string;
  brain_candidate?: boolean;
}

export interface TemplateRecommendation {
  template_name?: string;
  template_content?: string;
  rationale?: string;
  match_score?: number;
}

export interface GenerateOutlineResponse {
  title: string;
  hooks: OutlineHook[];
  sections: OutlineSection[];
  outline?: OutlineSection[];
  supporting_evidence?: SupportingEvidence[];
  cta?: string;
  recommendations?: TemplateRecommendation[];
  output_content_type?: string;
  pattern_analysis?: Record<string, unknown>;
  estimated_total_words?: number;
  seo_metadata?: {
    primary_keyword?: string;
    secondary_keywords?: string[];
    serp_analysis?: Record<string, unknown>;
    meta_description?: string;
    slug?: string;
  };
  packet_used?: string;
}

export interface RagContext {
  retrieved_count: number;
  categories_found: string[];
  top_similarity: number;
  error?: string | null;
  skipped?: boolean;
}

export interface WritePostResponse {
  final_post_body: string;
  post_content?: string;
  image_prompt?: string;
  image_prompts?: string[];
  metadata?: {
    platform?: string;
    author_id?: string;
    tone_used?: string;
    contentType?: string;
    rag_context?: RagContext;
  };
  packet_used?: string;
}

export interface GeoScore {
  generative_engine_visibility: number;
  content_depth: number;
  authority_signals: number;
  overall_score: number;
}

export interface WriteArticleResponse {
  final_article_body: string;
  final_article?: string;
  content_type?: string;
  title?: string;
  image_prompts?: string[];
  word_count?: number;
  geo_score?: GeoScore;
  seo_metadata?: Record<string, unknown>;
  rich_metadata?: {
    author?: string;
    generated_at?: string;
    rag_context?: RagContext;
  };
  metadata?: {
    rag_context?: RagContext;
  };
  packet_used?: string;
}

export interface ProcessingStatus {
  tracking_id: string;
  job_type: string;
  status: "initializing" | "in_progress" | "completed" | "failed";
  current_phase: string | null;
  phase_message: string | null;
  progress_percent: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

// ─── Authority Intelligence Types ─────────────────────────────

export interface PacketElement {
  id: string;
  text: string;
  title?: string;
}

export interface PacketResponse {
  id: string;
  theme: string;
  is_complete: boolean;
  coherence_score: number;
  readiness_stage: "draft" | "calibrating" | "ready";
  narrative_logic: string | null;
  missing_elements: string[];
  improvement_suggestions: string | null;
  elements: {
    anchor_story?: PacketElement;
    supporting_belief?: PacketElement;
    framework?: PacketElement;
    perspective?: PacketElement;
  };
}

export interface PacketsListResponse {
  packets: PacketResponse[];
  summary: {
    total: number;
    complete: number;
    incomplete: number;
  };
}

export interface CategoryUtilization {
  used: number;
  total: number;
  utilization: number;
}

export interface PacketGap {
  packet_id: string;
  theme: string;
  coherence_score: number;
  gap_type: string;
  blocking_element: string;
  diagnosis: string;
  voice_builder_prompt: string;
  expected_impact: string;
  expected_coherence: number;
  priority: string;
  prediction_confidence?: number;
  brain_candidates: unknown[];
  has_unlinked_knowledge: boolean;
}

export interface ContentPriority {
  priority: number;
  focus_area: string;
  rationale: string;
  voice_builder_prompt: string;
  expected_packets_improved: number;
  expected_coherence_lift: number;
  expected_new_packets?: number;
}

export interface PotentialTheme {
  theme: string;
  readiness: number;
  existing_elements: Record<string, number>;
  blocking_gap: string;
  voice_builder_prompt: string;
  expected_coherence: number;
}

export interface GapAnalysisResponse {
  author_id: string;
  packets_built: number;
  dna_utilization: {
    overall: number;
    overall_used: number;
    overall_total: number;
    by_category: {
      story: CategoryUtilization;
      belief: CategoryUtilization;
      framework: CategoryUtilization;
      perspective: CategoryUtilization;
    };
  };
  packet_gaps: PacketGap[];
  content_priorities: ContentPriority[];
  potential_themes: PotentialTheme[];
  summary: {
    high_priority_actions: number;
    packets_improvable: number;
    new_packets_potential: number;
    estimated_utilization_after_fixes: number;
    groups: {
      quick_wins: number;
      strategic: number;
      polish: number;
    };
  };
  grouped_gaps: {
    quick_wins: PacketGap[];
    strategic: PacketGap[];
    polish: PacketGap[];
  };
}

export interface RemediateGapRequest {
  author_id: string;
  gap_action_id: string;
  content: string;
  source: string;
}

export interface RemediateGapResponse {
  success: boolean;
  gap_action_id: string;
  packet_id: string;
  elements_extracted: Record<string, number>;
  coherence_before: number;
  coherence_after: number;
  is_complete: boolean;
  gap_resolved: boolean;
  message: string;
}

// ─── Voice Builder Types ──────────────────────────────────────

export interface VoiceMiningRequest {
  source_type: "text" | "youtube" | "gdoc" | "gsheet";
  content: string;
  author_id: string;
  user_id: string;
  extraction_focus: ("stories" | "beliefs" | "patterns")[];
  ownership?: "self" | "reference";
}

export interface VoiceMiningResponse {
  job_id: string;
  status: "processing";
}

export interface MiningJobStatus {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  current_phase?: string;
  progress_percent: number;
  result?: Record<string, unknown>;
  error?: string;
}

export interface ExtractedStory {
  id?: string;
  internal_title?: string;
  narrative_arc: {
    title?: string;
    the_setup: string;
    the_conflict: string;
    the_resolution: string;
    lesson?: string;
  };
  metadata?: {
    capture_date?: string;
    source_type?: string;
    themes?: string[];
    emotional_intensity?: string;
    narrative_type?: string;
    time_period?: string;
    key_entities?: string[];
  };
}

export interface ExtractedBelief {
  id?: string;
  belief_statement: string;
  why_it_matters: string;
  evidence?: string;
  metadata?: {
    conviction_level?: string;
    time_consistency?: string;
    supports_frameworks?: string[];
    related_stories?: string[];
  };
}

export interface ExtractedPattern {
  id?: string;
  pattern_name: string;
  description: string;
  examples: string[];
  metadata?: {
    frequency?: string;
    context_sensitivity?: string;
    formality_level?: string;
    emotional_valence?: string;
    use_when?: string;
    avoid_when?: string;
  };
}

export interface ExtractedFramework {
  id?: string;
  name: string;
  description: string;
  steps?: string[];
  metadata?: {
    themes?: string[];
    domain?: string;
  };
}

export interface ExtractedPerspective {
  id?: string;
  label: string;
  stance: string;
  domain?: string;
  metadata?: {
    themes?: string[];
  };
}

export interface VoiceIngestData {
  stories?: ExtractedStory[];
  beliefs?: ExtractedBelief[];
  patterns?: ExtractedPattern[];
  frameworks?: ExtractedFramework[];
  perspectives?: ExtractedPerspective[];
  quotes?: unknown[];
  tone?: unknown[];
  experience?: unknown[];
  knowledge?: unknown[];
  preferences?: unknown[];
}

export interface IngestConflict {
  conflict_type: "semantic_duplicate" | "contradiction" | "tone_drift";
  severity: "high" | "medium" | "low";
  item_type: string;
  reason: string;
  suggested_action: string;
  new_item_summary: { type: string; id: string; title: string };
  existing_item_summary: { type: string; id: string; title: string };
}

export interface VoiceIngestResponse {
  success: true;
  stats: {
    categories_updated: string[];
    db_result: Record<string, unknown>;
    rag_result: Record<string, unknown>;
    conflicts_checked: boolean;
    conflicts_found: number;
  };
}

export interface VoiceIngestConflictResponse {
  status: "requires_confirmation";
  conflicts: IngestConflict[];
}

export interface ConflictResolution {
  conflict_index: number;
  action: "merge" | "skip" | "force";
}

// ─── Brain Builder Types ──────────────────────────────────────

export interface BrainCandidate {
  temp_id: string;
  type: "framework" | "myth" | "truth" | "statistic";
  title: string;
  summary: string;
  key_quotes: string[];
  suggested_tags: string[];
}

export interface BrainCurateResponse {
  source_metadata: {
    url: string;
    title?: string;
    description?: string;
    author?: string;
  };
  candidates: BrainCandidate[];
}

export interface BrainCommitItem {
  title: string;
  summary: string;
  key_quotes: string[];
  tactical_application?: string;
  endorsement_level: "full" | "partial" | "anti_model" | "reference";
  user_notes?: string;
  strategic_tags: string[];
  source_url?: string;
  source_title?: string;
  source_author?: string;
  source_type?: "article" | "book" | "video" | "paper";
}

export interface ExternalKnowledge {
  id: string;
  author_id: string;
  connection_id: string;
  source_url?: string;
  source_title: string;
  source_author?: string;
  source_type: string;
  title: string;
  summary: string;
  key_quotes: string[];
  tactical_application?: string;
  endorsement_level: "full" | "partial" | "anti_model" | "reference";
  user_notes?: string;
  strategic_tags: string[];
  cluster_id?: number;
  created_at: string;
  updated_at: string;
}

export interface BrainCommitResponse {
  success: boolean;
  committed_count: number;
  connection_id: string;
  items: ExternalKnowledge[];
}

export interface BrainLibraryResponse {
  author_id: string;
  total_count: number;
  items: ExternalKnowledge[];
  by_endorsement: {
    full: number;
    partial: number;
    anti_model: number;
    reference: number;
  };
}

export interface BrainSearchResult {
  knowledge: ExternalKnowledge;
  similarity: number;
}

export interface BrainSearchResponse {
  results: BrainSearchResult[];
  query: string;
  threshold: number;
}

// ─── Content Sessions Types (NEW column names — used by pipeline save) ───

export interface ContentSession {
  id: string;
  author_id: string;
  user_id: string;
  strategy?: string;
  content_type: string;
  title?: string;
  status: "draft" | "completed" | "archived";
  raw_input?: string;
  selected_angle?: ContentAngle;
  outline?: GenerateOutlineResponse;
  selected_hook?: OutlineHook;
  written_content?: WritePostResponse | WriteArticleResponse;
  angles_context?: AnglesContext;
  final_content?: string;
  word_count?: number;
  impressions?: number;
  likes?: number;
  comments?: number;
  reposts?: number;
  published_url?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentSessionListResponse {
  sessions: ContentSession[];
  total: number;
}

export interface OutcomeUpdateRequest {
  impressions?: number;
  likes?: number;
  comments?: number;
  reposts?: number;
  published_url?: string;
}

// ─── Draft Session Types (OLD column names — used by Drafts page) ────

export interface DraftSession {
  id: string;
  user_id: string;
  author_id?: string;
  session_record_id?: string;
  content_strategy?: string;
  content_type?: string;
  research_strategy?: string;
  youtube_url?: string;
  target_icp?: string;
  current_phase?: string;
  status?: string;
  all_angles?: unknown[];
  selected_angle?: Record<string, unknown>;
  full_context?: Record<string, unknown>;
  approved_context?: Record<string, unknown>;
  outline_data?: Record<string, unknown>;
  full_outline_response?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // NEW columns (from migration 024, populated for new pipeline sessions)
  strategy?: string;
  title?: string;
  outline?: Record<string, unknown>;
  written_content?: Record<string, unknown>;
  final_content?: string;
  word_count?: number;
}

// ─── Generated Posts Types (All Content page) ────────────────

export interface GeneratedPost {
  id: string;
  user_id: string;
  session_id?: string;
  post_title?: string;
  post_body: string;
  image_prompt?: string;
  selected_hook?: Record<string, unknown>;
  selected_template?: Record<string, unknown>;
  selected_evidence?: Record<string, unknown>;
  previous_versions?: unknown[];
  version: number;
  status: string;
  created_at: string;
  updated_at: string;
  content_sessions?: {
    id: string;
    youtube_url?: string;
    author_id?: string;
    target_icp?: string;
    selected_angle?: Record<string, unknown>;
    content_strategy?: string;
    content_type?: string;
  };
}

// ─── Model Settings Types ────────────────────────────────────

export interface ModelPreferences {
  tier_fast: string;
  tier_research: string;
  tier_writing: string;
}

export interface AvailableModel {
  model_id: string;
  display_name: string;
  provider: string;
  input_cost_per_1m: number;
  output_cost_per_1m: number;
  tier_compatibility: string[];
  is_active: boolean;
}

// ─── Templates (LinkedIn Post Templates) ────────────────────

export interface LinkedInPostTemplate {
  id: number;
  template_number: number;
  name: string;
  description: string;
  template_content: string;
  category: string;
  created_at: string;
}

export interface TemplatesListResponse {
  templates: LinkedInPostTemplate[];
  total: number;
}

// ─── Evidence / Radar Scan Types ─────────────────────────────

export interface RadarEvidenceItem {
  source_url: string;
  source_title: string;
  snippet: string;
  relevance_score: number;
  evidence_type: "statistic" | "study" | "expert_opinion" | "counter_argument";
}

export interface RadarScanRequest {
  author_id: string;
  belief_text: string;
  belief_id?: string;
  scan_type: "evidence" | "counter";
  max_results?: number;
}

export interface RadarScanResponse {
  success: boolean;
  author_id: string;
  query_used: string;
  scan_type: string;
  evidence_items: RadarEvidenceItem[];
  total_found: number;
  curate_candidates: Record<string, unknown>[];
  message: string;
  summary?: string;
}

// ─── ICP Types ──────────────────────────────────────────────

export interface ICPPainGain {
  id?: string;
  icp_id?: string;
  pain_title?: string;
  pain_description?: string;
  description?: string;
  gain_title?: string;
  gain_description?: string;
  hope_dream?: string;
  category?: string;
  subcategory?: string;
  source_url?: string;
  [key: string]: unknown;
}

export interface ICP {
  id: string;
  brand_id: string;
  user_id?: string;
  name: string;
  demographics?: string;
  previous_actions?: string;
  purchase_drivers?: string;
  aspirations?: string;
  frustrations?: string;
  before_state?: Record<string, string>;
  after_state?: Record<string, string>;
  sales_filters?: string;
  pains_gains?: ICPPainGain[];
  created_at?: string;
}

export interface ICPListResponse {
  icps: ICP[];
  total: number;
}

export interface ICPGenerateResponse {
  success: boolean;
  saved: boolean;
  authenticated: boolean;
  icp: ICP;
}

// ─── Transcription Types (Fireflies) ────────────────────────

export interface TranscriptionSummaryData {
  overview?: string;
  short_summary?: string;
  action_items?: string[];
  topics_discussed?: string[];
  keywords?: string[];
  outline?: string;
}

export interface FirefliesTranscription {
  id: number;
  title: string;
  transcript: string | null;
  transcript_summary: string | null;
  transcript_id: string | null;
  record_id: string | null;
  user_id: string;
  duration_minutes: number | null;
  meeting_type: string | null;
  meeting_date: string | null;
  organizer_email: string | null;
  participants: string[] | null;
  fireflies_url: string | null;
  summary_data: TranscriptionSummaryData | null;
  created_at: string;
}

export interface TranscriptionTrainingUsage {
  id: string;
  transcription_id: number;
  author_id: string;
  user_id: string;
  training_tracking_id: string | null;
  trained_at: string;
  created_at: string;
}

// ─── Market Analysis Types ──────────────────────────────────

export interface MarketSession {
  session_id: string;
  search_topic: string;
  created_at: string;
  post_count: number;
  total_likes: number;
}

export interface MarketSessionsResponse {
  sessions: MarketSession[];
  total: number;
}

export interface MarketPost {
  id: string;
  user_id: string;
  session_id: string;
  search_topic: string;
  author_name: string;
  author_headline: string;
  author_url: string;
  post_url: string;
  post_content: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_selected: boolean;
  created_at?: string;
}

export interface MarketSessionDetailResponse {
  session_id: string;
  search_topic: string;
  posts: MarketPost[];
  total: number;
}

export interface MarketHuntRequest {
  payload: {
    topic: string;
    limit?: number;
    minLikes?: number;
    session_id?: string;
  };
  user_id: string;
  author_id: string;
  author_name: string;
  brand_id: string;
}

export interface MarketHuntResponse {
  success: boolean;
  session_id: string;
  topic: string;
  total_results: number;
  posts: MarketPost[];
}

// ─── Framework Types ────────────────────────────────────────

export interface BrandFramework {
  id: string;
  brand_id: string;
  user_id?: string;
  name: string;
  framework_id?: string;
  framework_name?: string;
  purpose_overview?: string;
  core_promise?: string;
  description?: string;
  unique_benefit?: string;
  key_components?: FrameworkComponent[];
  applications?: string;
  implementation_guidelines?: string;
  analogies?: string;
  tags_keywords?: string[];
  reasoning?: string;
  quote?: string;
  quote_author?: string;
  further_context?: string;
  framework_author?: string;
  source_transcription_ids?: number[];
  created_at?: string;
  updated_at?: string;
}

export interface FrameworkComponent {
  name: string;
  description?: string;
  key_points?: string[];
  examples?: { context?: string; implementation?: string; outcome?: string }[];
  sub_components?: { name: string; description?: string }[];
  best_practices?: string[];
  common_mistakes?: string[];
  [key: string]: unknown;
}

export interface FrameworkListResponse {
  frameworks: BrandFramework[];
  total: number;
}

export interface ExtractFrameworkRequest {
  transcription_id: number;
  author_id: string;
  framework_name?: string;
  use_batch?: boolean;
}

export interface BatchJobResponse {
  batch: boolean;
  batch_id: string;
  openai_batch_id: string;
  status: string;
  message: string;
}

// ─── Onboarding Types ───────────────────────────────────────

export interface OnboardingStep {
  step_key: string;
  label: string;
  description: string;
  href: string;
  completed_at?: string;
}

export interface OnboardingStatus {
  steps: OnboardingStep[];
  completed_count: number;
  total_steps: number;
  completion_percent: number;
}

// ─── Performance ────────────────────────────────────────────

export interface LinkedInPostPerformance {
  post_id: string;
  content: string;
  posted_at: string;
  linkedin_url: string | null;
  posting_type: string;
  author_name: string | null;
  engagement_likes: number;
  engagement_comments: number;
  engagement_shares: number;
  empathy_count: number;
  total_engagement: number;
}

export interface PerformanceSummary {
  total_posts: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_empathy: number;
  avg_engagement_per_post: number;
  linked_count: number;
}

export interface PerformanceResponse {
  linkedin_posts: LinkedInPostPerformance[];
  content_outcomes: ContentSession[];
  summary: PerformanceSummary;
}
