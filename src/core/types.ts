/**
 * Genesis Framework - Core Type Definitions
 * Foundation Reset: Supervised-First Control Model
 * @version 2.0.0
 */

// ============================================================================
// Phase & Status Types
// ============================================================================

export type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PhaseStatus = 
  | 'NOT_INITIALIZED'
  | 'AWAITING_APPROVAL'    // Human must approve to proceed
  | 'IN_PROGRESS'          // Work is being done
  | 'PENDING_VALIDATION'   // Ready for validation
  | 'PENDING_CHECKPOINT'   // Validated, awaiting human approval
  | 'COMPLETED'            // Phase done, approved
  | 'HALTED';              // Stopped, needs intervention

export type GateStatus = 'LOCKED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED';

export type AgentName = 
  | 'product_owner'
  | 'architect'
  | 'tech_lead'
  | 'researcher'
  | 'developer'
  | 'validator'
  | 'deployer';

// Simplified halt codes - 5 essential ones
export type HaltCode = 
  | 'HALT-001'   // Validation failed (hard gate)
  | 'HALT-002'   // Phase skip attempted
  | 'HALT-003'   // Repeated error (3x same fingerprint)
  | 'HALT-004'   // Required artifact missing
  | 'HALT-005';  // Security issue detected

export type Severity = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';

export type CheckpointType = 
  | 'PROJECT_INIT'
  | 'PHASE_COMPLETE';

export type ApprovalResponse = 'APPROVE' | 'REJECT' | 'SKIP' | 'UNDO';

// ============================================================================
// State Interfaces (Simplified)
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
  resume_point: string | null;
  last_action: string | null;
}

export interface AgentContext {
  name: AgentName;
  phase: Phase;
  prompt_path: string;
  loaded: boolean;
  prompt_lines: number;
  artifacts_loaded: string[];
}

export interface CheckpointState {
  pending: boolean;
  type: CheckpointType | null;
  requested_at: string | null;
  context: string | null;
  validation_passed: boolean;
  history: CheckpointHistoryEntry[];
}

export interface CheckpointHistoryEntry {
  type: CheckpointType;
  phase: Phase;
  requested_at: string;
  resolved_at: string;
  response: ApprovalResponse;
  feedback?: string;
}

export interface ProgressState {
  phase_1_complete: boolean;
  phase_2_complete: boolean;
  phase_3_complete: boolean;
  phase_4_complete: boolean;
  phase_5_complete: boolean;
  phase_6_complete: boolean;
  phase_7_complete: boolean;
}

export interface ErrorEntry {
  id: string;
  timestamp: string;
  phase: Phase;
  severity: Severity;
  code: HaltCode | null;
  message: string;
  fingerprint: string;
  retry_count: number;
}

export interface ErrorsState {
  active: ErrorEntry[];
  count: number;
  fingerprints: Record<string, { count: number; last_seen: string }>;
}

export interface TransitionEntry {
  timestamp: string;
  from_phase: Phase;
  to_phase: Phase;
  trigger: 'APPROVE' | 'SKIP' | 'UNDO' | 'INIT' | 'FORCE' | 'OVERRIDE';
  approved_by: 'human';
  reason?: string;
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  phase: Phase;
  reason: string;
  user: 'human';
}

// ============================================================================
// Simplified Config - Supervised First
// ============================================================================

export interface ConfigState {
  // Core settings
  max_retries: number;              // Error retries before halt
  max_iterations: number;           // Refinements per phase
  
  // All approvals require human - this is the foundation
  // No autonomous_mode, no auto_approve settings
  
  // Simplified halt codes
  halt_codes: HaltCode[];
}

// ============================================================================
// Main Status Interface (Simplified)
// ============================================================================

export interface GenesisStatus {
  // Core state
  project: ProjectState;
  phase: PhaseState;
  session: SessionState;
  
  // Current agent context (loaded on demand)
  agent: AgentContext | null;
  
  // Context budget tracking
  context: {
    prompt_lines: number;
    artifacts_lines: number;
    total_lines: number;
    budget_lines: number;
  };
  
  // Gate tracking
  gates: Record<string, GateStatus>;
  
  // Human approval checkpoints
  checkpoints: CheckpointState;
  
  // Progress tracking
  progress: ProgressState;
  
  // Halt state
  halted: boolean;
  halt_reason: string | null;
  halt_code: HaltCode | null;
  
  // Error tracking
  errors: ErrorsState;
  
  // Audit trail
  transitions: TransitionEntry[];
  audit: AuditEntry[];
  
  // Iteration tracking
  iteration: {
    count: number;
    max: number;
    feedback: string | null;
  };
  
  // Configuration
  config: ConfigState;
}

// ============================================================================
// Command Types (Simplified)
// ============================================================================

export type GenesisCommand = 
  // Core workflow
  | { type: 'STATUS' }
  | { type: 'INIT'; name: string; description?: string }
  | { type: 'VALIDATE' }
  | { type: 'CHECKPOINT' }
  | { type: 'ITERATE'; feedback: string }
  
  // Human control (all require human action)
  | { type: 'APPROVE'; feedback?: string }
  | { type: 'REJECT'; feedback: string }
  | { type: 'SKIP'; reason: string }           // Force skip with justification
  | { type: 'UNDO' }                           // Go back one phase
  | { type: 'FORCE'; action: string; reason: string }  // Force any action with audit
  | { type: 'OVERRIDE'; gate: string; reason: string } // Override specific gate
  
  // System control
  | { type: 'HALT'; code: HaltCode; reason: string }
  | { type: 'RESUME'; justification: string }
  | { type: 'ROLLBACK'; phase: Phase }
  
  // Context loading (on-demand)
  | { type: 'LOAD_AGENT'; phase: Phase }
  | { type: 'LOAD_ARTIFACT'; path: string }
  | { type: 'CONTEXT_STATUS' }
  | { type: 'RESET_CONTEXT' }
  
  // Audit trail
  | { type: 'HISTORY' };

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
  awaiting_approval?: boolean;
  halt?: { code: HaltCode; reason: string };
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationCriterion {
  id: string;
  description: string;
  required: boolean;  // true = must pass, false = warning only
}

export interface ValidationResult {
  passed: boolean;
  phase: Phase;
  criteria: Array<{
    id: string;
    description: string;
    passed: boolean;
    required: boolean;
  }>;
  failures: string[];
  warnings: string[];
}

// ============================================================================
// Event Types (Simplified)
// ============================================================================

export type GenesisEvent = 
  | { type: 'INITIALIZED'; project: string }
  | { type: 'PHASE_CHANGED'; from: Phase; to: Phase; approved_by: 'human' }
  | { type: 'CHECKPOINT_REQUESTED'; phase: Phase }
  | { type: 'CHECKPOINT_APPROVED'; phase: Phase }
  | { type: 'CHECKPOINT_REJECTED'; phase: Phase; feedback: string }
  | { type: 'HALTED'; code: HaltCode; reason: string }
  | { type: 'RESUMED'; justification: string }
  | { type: 'VALIDATION_COMPLETE'; passed: boolean };

export type EventHandler = (event: GenesisEvent) => void | Promise<void>;
