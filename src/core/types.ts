/**
 * Genesis Framework - Core Type Definitions
 * @version 1.0.0
 */

// ============================================================================
// Phase & Status Types
// ============================================================================

export type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PhaseStatus = 
  | 'NOT_INITIALIZED'
  | 'AWAITING_HUMAN'
  | 'IN_PROGRESS'
  | 'VALIDATING'
  | 'CHECKPOINT_PENDING'
  | 'COMPLETED'
  | 'HALTED';

export type GateStatus = 'LOCKED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED';

export type AgentName = 
  | 'orchestrator'
  | 'product_owner'
  | 'architect'
  | 'tech_lead'
  | 'researcher'
  | 'developer'
  | 'validator'
  | 'deployer';

export type HaltCode = 
  | 'HALT-001' | 'HALT-002' | 'HALT-003' | 'HALT-004'
  | 'HALT-005' | 'HALT-006' | 'HALT-007' | 'HALT-008'
  | 'HALT-009' | 'HALT-010' | 'HALT-011' | 'HALT-012'
  | 'HALT-013';

export type Severity = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';

export type CheckpointType = 
  | 'PROJECT_INIT'
  | 'REQ_COMPLETE'
  | 'DESIGN_COMPLETE'
  | 'TASKS_COMPLETE'
  | 'RESEARCH_COMPLETE'
  | 'IMPL_COMPLETE'
  | 'VALIDATION_COMPLETE'
  | 'DEPLOY_COMPLETE';

export type ApprovalResponse = 'APPROVE' | 'REJECT' | 'DEFER' | 'ABORT';

export type SoftGatePolicy = 'warn_and_continue' | 'warn_and_confirm' | 'accumulate_and_block';

// ============================================================================
// State Interfaces
// ============================================================================

export interface ProjectState {
  name: string | null;
  description: string | null;
  created: string | null;
  updated: string | null;
  version: string;
}

export interface PhaseState {
  current: Phase;
  status: PhaseStatus;
  labels: Record<Phase, string>;
}

export interface SessionState {
  last_active: string | null;
  stale_threshold_hours: number;
  resume_point: string | null;
  last_action: string | null;
  last_artifact_modified: string | null;
}

export interface AgentSync {
  status: 'NOT_SYNCED' | 'SYNCED' | 'FAILED';
  last_synced: string | null;
  prompt_loaded: string | null;
  prompt_hash: string | null;
  identity_verified: boolean;
}

export interface AgentRegistryEntry {
  prompt: string;
  phase: Phase | 'all';
  active: boolean;
  prompt_hash: string | null;
}

export interface AgentsState {
  active: AgentName | null;
  sync: AgentSync;
  registry: Record<AgentName, AgentRegistryEntry>;
}

export interface CheckpointState {
  pending: boolean;
  type: CheckpointType | null;
  requested_at: string | null;
  expires_at: string | null;
  context: string | null;
  partial: boolean;
  partial_progress: string | null;
  history: CheckpointHistoryEntry[];
}

export interface CheckpointHistoryEntry {
  type: CheckpointType;
  requested_at: string;
  resolved_at: string;
  response: ApprovalResponse;
  feedback?: string;
}

export interface IterationState {
  active: boolean;
  feedback: string | null;
  iteration_count: number;
  max_iterations: number;
}

export interface ProgressState {
  phase_1_requirements_drafted: boolean;
  phase_1_requirements_validated: boolean;
  phase_2_components_designed: string[];
  phase_2_components_total: number;
  phase_3_tasks_created: string[];
  phase_3_tasks_total: number;
  phase_4_docs_completed: string[];
  phase_4_docs_total: number;
  phase_5_tasks_completed: string[];
  phase_5_tasks_total: number;
  phase_6_tests_passed: string[];
  phase_6_tests_total: number;
  phase_7_deployment_steps: string[];
  phase_7_deployment_total: number;
}

export interface ErrorEntry {
  id: string;
  timestamp: string;
  phase: Phase;
  agent: AgentName;
  severity: Severity;
  category: 'VALIDATION' | 'RESEARCH' | 'EXECUTION' | 'STATE' | 'SECURITY';
  code: HaltCode | null;
  message: string;
  context: string;
  fingerprint: string;
  retry_count: number;
  max_retries: number;
  resolution: string | null;
  status: 'OPEN' | 'RESOLVED' | 'BLOCKED';
}

export interface ErrorsState {
  active: ErrorEntry[];
  count: number;
  fingerprints: Record<string, { count: number; last_seen: string; blocked: boolean }>;
  patterns: {
    tracked: string[];
    root_causes: Record<string, string>;
  };
}

export interface TransitionEntry {
  timestamp: string;
  from_phase: Phase;
  to_phase: Phase;
  trigger: string;
  agent: AgentName;
  artifacts_modified: string[];
}

export interface PhaseTimingMetrics {
  started: string | null;
  completed: string | null;
  duration_hours: number | null;
}

export interface AgentPerformanceMetrics {
  tasks_completed: number;
  avg_iteration_count: number;
  rejection_rate: number;
  cache_hit_rate?: number;
}

export interface MetricsState {
  phases_completed: number;
  checkpoints_approved: number;
  checkpoints_rejected: number;
  iterations_total: number;
  partial_checkpoints: number;
  errors_total: number;
  errors_resolved: number;
  rollbacks: number;
  phase_timing: Record<string, PhaseTimingMetrics>;
  agent_performance: Record<AgentName, AgentPerformanceMetrics>;
  failure_patterns: FailurePattern[];
  bottlenecks: Bottleneck[];
}

export interface FailurePattern {
  pattern_id: string;
  description: string;
  occurrences: number;
  phases: Phase[];
  agents: AgentName[];
  first_seen: string;
  last_seen: string;
  resolution: string | null;
  status: 'active' | 'resolved' | 'monitoring';
}

export interface Bottleneck {
  phase: Phase;
  agent: AgentName;
  metric: string;
  value: number;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  suggestion: string;
}

export interface SoftGateViolation {
  id: string;
  rule: string;
  phase: Phase;
  timestamp: string;
  details: string;
  threshold: number;
  actual: number;
  acknowledged: boolean;
  acknowledged_by: string | null;
}

export interface SoftGatesState {
  enabled: boolean;
  violations: SoftGateViolation[];
  policy: SoftGatePolicy;
  rules: Record<string, { severity: 'soft' | 'hard'; threshold: number }>;
}

export interface ResearchCacheEntry {
  url: string;
  fetched_at: string;
  expires_at: string;
  ttl_hours: number;
  content_hash: string;
  version: string;
  source_confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  content: string;
  metadata: {
    title: string;
    library: string;
    feature: string;
  };
}

export interface ResearchCacheState {
  enabled: boolean;
  ttl_hours: number;
  cache_path: string;
  entries: Record<string, ResearchCacheEntry>;
  integrity: {
    last_verified: string | null;
    status: 'unknown' | 'verified' | 'failed';
    corrupted_entries: string[];
    auto_repair: boolean;
  };
}

export interface ResearchSourceTier {
  confidence: number;
  auto_approve: boolean;
}

export interface ResearchSourceUsage {
  library: string;
  feature: string;
  tier: number;
  confidence: number;
  source_url: string;
  timestamp: string;
  approved_by: 'auto' | 'human';
  justification?: string;
}

export interface ResearchSourcesState {
  tiers: Record<string, ResearchSourceTier>;
  minimum_confidence: number;
  usage_log: ResearchSourceUsage[];
}

export interface RollbackVerification {
  last_verified: string | null;
  status: 'unknown' | 'verified' | 'failed';
  archive_integrity: Record<string, boolean>;
  dry_run_available: boolean;
}

export interface RollbackState {
  last_rollback: string | null;
  archive_path: string;
  rollback_count: number;
  verification: RollbackVerification;
}

export interface ContextState {
  max_lines_per_artifact: number;
  chunking_enabled: boolean;
  current_chunk: number | null;
  total_chunks: number | null;
  chunk_boundaries: 'semantic' | 'line';
}

export interface CollaborationState {
  mode: 'single' | 'team';
  assignees: Record<string, string>;
  current_user: string | null;
}

export interface ConfigState {
  max_retries: number;
  max_iterations: number;
  checkpoint_expiry_hours: number;
  checkpoint_expiry_by_type: Record<CheckpointType, number>;
  session_stale_hours: number;
  require_human_approval: boolean;
  strict_mode: boolean;
  allow_partial_checkpoints: boolean;
  require_agent_sync: boolean;
  validate_prompt_hash_on_sync: boolean;
  research_fallback_enabled: boolean;
  research_fallback_requires_approval: boolean;
  research_cache_enabled: boolean;
  validate_prompts_on_init: boolean;
  parallel_execution_enabled: boolean;
  max_parallel_tasks: number;
  halt_codes: HaltCode[];
  soft_gate_policy: SoftGatePolicy;
  tiered_research_enabled: boolean;
  prompt_versioning_enabled: boolean;
  rollback_verification_enabled: boolean;
  observability_enabled: boolean;
  error_retry_by_severity: Record<Severity, number>;
}

// ============================================================================
// Main Status Interface
// ============================================================================

export interface GenesisStatus {
  project: ProjectState;
  prompts: {
    version: string;
    schema_version: string;
    versions: Record<AgentName, { version: string; updated: string | null; checksum: string | null }>;
    compatibility: { min_version: string; migration_available: boolean };
  };
  phase: PhaseState;
  session: SessionState;
  agents: AgentsState;
  gates: Record<string, GateStatus>;
  soft_gates: SoftGatesState;
  checkpoints: CheckpointState;
  iteration: IterationState;
  progress: ProgressState;
  collaboration: CollaborationState;
  halted: boolean;
  halt_reason: string | null;
  halt_code: HaltCode | null;
  errors: ErrorsState;
  transitions: TransitionEntry[];
  metrics: MetricsState;
  context: ContextState;
  research_cache: ResearchCacheState;
  research_sources: ResearchSourcesState;
  rollback: RollbackState;
  config: ConfigState;
}

// ============================================================================
// Command Types
// ============================================================================

export type GenesisCommand = 
  | { type: 'STATUS' }
  | { type: 'INIT'; name: string }
  | { type: 'VALIDATE' }
  | { type: 'CHECKPOINT'; partial?: boolean }
  | { type: 'ADVANCE' }
  | { type: 'ITERATE'; feedback: string }
  | { type: 'HALT'; code: HaltCode; reason: string }
  | { type: 'RESUME'; justification?: string }
  | { type: 'ROLLBACK'; phase: Phase; dryRun?: boolean }
  | { type: 'AGENT'; name: AgentName }
  | { type: 'CHUNK'; number: number }
  | { type: 'CACHE_CLEAR'; library?: string }
  | { type: 'CACHE_STATUS' }
  | { type: 'METRICS' }
  | { type: 'METRICS_EXPORT'; format: 'json' | 'csv' | 'md' }
  | { type: 'SOFT_GATES' }
  | { type: 'APPROVE'; feedback?: string }
  | { type: 'REJECT'; feedback: string }
  | { type: 'DEFER' }
  | { type: 'ABORT' };

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
  halt?: { code: HaltCode; reason: string };
  checkpoint?: { type: CheckpointType; awaiting_approval: boolean };
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationCriterion {
  id: string;
  description: string;
  check: (status: GenesisStatus) => boolean;
  severity: 'hard' | 'soft';
}

export interface ValidationResult {
  passed: boolean;
  criteria: Array<{
    id: string;
    description: string;
    passed: boolean;
    severity: 'hard' | 'soft';
  }>;
  hardFailures: string[];
  softWarnings: string[];
}

// ============================================================================
// Event Types
// ============================================================================

export type GenesisEvent = 
  | { type: 'PHASE_CHANGED'; from: Phase; to: Phase }
  | { type: 'CHECKPOINT_REQUESTED'; checkpointType: CheckpointType }
  | { type: 'CHECKPOINT_APPROVED'; checkpointType: CheckpointType }
  | { type: 'CHECKPOINT_REJECTED'; checkpointType: CheckpointType; feedback: string }
  | { type: 'HALTED'; code: HaltCode; reason: string }
  | { type: 'RESUMED' }
  | { type: 'ERROR_LOGGED'; error: ErrorEntry }
  | { type: 'AGENT_SYNCED'; agent: AgentName }
  | { type: 'ROLLBACK_COMPLETED'; from: Phase; to: Phase }
  | { type: 'ITERATION_APPLIED'; count: number };

export type EventHandler = (event: GenesisEvent) => void | Promise<void>;
