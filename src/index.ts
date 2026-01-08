/**
 * Genesis Framework
 * Supervised SaaS Factory with Context Optimization and Editor Integration
 * @version 2.0.0
 */

export { GenesisOrchestrator } from './core/orchestrator';
export { StateManager } from './core/state-manager';
export { ValidationEngine } from './core/validator';
export { GenesisMCPServer } from './mcp/server';

export type {
  // Core types
  Phase,
  PhaseStatus,
  GateStatus,
  AgentName,
  HaltCode,
  Severity,
  CheckpointType,
  ApprovalResponse,
  
  // State interfaces
  GenesisStatus,
  ProjectState,
  PhaseState,
  SessionState,
  AgentContext,
  CheckpointState,
  ProgressState,
  ErrorEntry,
  ErrorsState,
  TransitionEntry,
  AuditEntry,
  ConfigState,
  
  // Command types
  GenesisCommand,
  CommandResult,
  
  // Validation types
  ValidationCriterion,
  ValidationResult,
  
  // Event types
  GenesisEvent,
  EventHandler
} from './core/types';
