/**
 * Genesis Framework - State Manager
 * Handles all state persistence and atomic updates
 * @version 1.0.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import type { 
  GenesisStatus, 
  Phase, 
  AgentName, 
  HaltCode,
  CheckpointType,
  TransitionEntry,
  ErrorEntry,
  GenesisEvent,
  EventHandler
} from './types';

export class StateManager {
  private statusPath: string;
  private status: GenesisStatus | null = null;
  private eventHandlers: EventHandler[] = [];
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
    this.statusPath = path.join(workspacePath, '.genesis', 'status.json');
  }

  // ============================================================================
  // Core State Operations
  // ============================================================================

  async load(): Promise<GenesisStatus> {
    try {
      const content = await fs.readFile(this.statusPath, 'utf-8');
      this.status = JSON.parse(content) as GenesisStatus;
      return this.status;
    } catch (error) {
      throw new Error(`Failed to load status.json: ${error}`);
    }
  }

  async save(): Promise<void> {
    if (!this.status) {
      throw new Error('No status loaded');
    }
    
    // Update timestamp
    this.status.session.last_active = new Date().toISOString();
    this.status.project.updated = new Date().toISOString();
    
    const content = JSON.stringify(this.status, null, 2);
    await fs.writeFile(this.statusPath, content, 'utf-8');
  }

  get(): GenesisStatus {
    if (!this.status) {
      throw new Error('Status not loaded. Call load() first.');
    }
    return this.status;
  }

  // ============================================================================
  // Event System
  // ============================================================================

  onEvent(handler: EventHandler): void {
    this.eventHandlers.push(handler);
  }

  private async emit(event: GenesisEvent): Promise<void> {
    for (const handler of this.eventHandlers) {
      await handler(event);
    }
  }

  // ============================================================================
  // Phase Management
  // ============================================================================

  async setPhase(phase: Phase, status: GenesisStatus['phase']['status']): Promise<void> {
    const oldPhase = this.get().phase.current;
    this.get().phase.current = phase;
    this.get().phase.status = status;
    
    if (oldPhase !== phase) {
      await this.emit({ type: 'PHASE_CHANGED', from: oldPhase, to: phase });
    }
    
    await this.save();
  }

  async advancePhase(): Promise<Phase> {
    const current = this.get().phase.current;
    if (current >= 7) {
      throw new Error('Already at final phase');
    }
    
    const next = (current + 1) as Phase;
    await this.setPhase(next, 'IN_PROGRESS');
    
    // Update gate status
    const gateKey = `gate_${next}_${this.getGateName(next)}`;
    this.get().gates[gateKey] = 'IN_PROGRESS';
    
    // Record transition
    await this.recordTransition(current, next, 'ADVANCE');
    
    // Update metrics
    if (current > 0) {
      const timingKey = `phase_${current}`;
      this.get().metrics.phase_timing[timingKey].completed = new Date().toISOString();
      
      const started = this.get().metrics.phase_timing[timingKey].started;
      if (started) {
        const duration = (Date.now() - new Date(started).getTime()) / (1000 * 60 * 60);
        this.get().metrics.phase_timing[timingKey].duration_hours = Math.round(duration * 10) / 10;
      }
    }
    
    // Start timing for new phase
    const newTimingKey = `phase_${next}`;
    this.get().metrics.phase_timing[newTimingKey].started = new Date().toISOString();
    
    await this.save();
    return next;
  }

  private getGateName(phase: Phase): string {
    const names: Record<Phase, string> = {
      0: 'init',
      1: 'requirements',
      2: 'design',
      3: 'tasks',
      4: 'research',
      5: 'implementation',
      6: 'validation',
      7: 'deployment'
    };
    return names[phase];
  }

  // ============================================================================
  // Agent Management
  // ============================================================================

  async activateAgent(agent: AgentName): Promise<void> {
    const status = this.get();
    
    // Deactivate current agent
    if (status.agents.active) {
      status.agents.registry[status.agents.active].active = false;
    }
    
    // Activate new agent
    status.agents.active = agent;
    status.agents.registry[agent].active = true;
    
    await this.save();
  }

  async syncAgent(agent: AgentName): Promise<{ success: boolean; identity: string }> {
    const status = this.get();
    const registry = status.agents.registry[agent];
    
    if (!registry) {
      throw new Error(`Unknown agent: ${agent}`);
    }
    
    const promptPath = path.join(this.workspacePath, registry.prompt);
    
    try {
      const content = await fs.readFile(promptPath, 'utf-8');
      
      // Verify required sections
      if (!content.includes('## Agent Identity')) {
        throw new Error('Missing ## Agent Identity section');
      }
      if (!content.includes('## Activation Condition')) {
        throw new Error('Missing ## Activation Condition section');
      }
      
      // Extract identity
      const identityMatch = content.match(/## Agent Identity\s*\n([^\n]+)/);
      const identity = identityMatch ? identityMatch[1].trim() : 'Unknown';
      
      // Calculate hash
      const hash = createHash('sha256').update(content).digest('hex').substring(0, 16);
      
      // Update sync status
      status.agents.sync = {
        status: 'SYNCED',
        last_synced: new Date().toISOString(),
        prompt_loaded: registry.prompt,
        prompt_hash: hash,
        identity_verified: true
      };
      
      registry.prompt_hash = hash;
      
      await this.save();
      await this.emit({ type: 'AGENT_SYNCED', agent });
      
      return { success: true, identity };
    } catch (error) {
      status.agents.sync.status = 'FAILED';
      await this.save();
      throw error;
    }
  }

  getAgentForPhase(phase: Phase): AgentName {
    const mapping: Record<Phase, AgentName> = {
      0: 'orchestrator',
      1: 'product_owner',
      2: 'architect',
      3: 'tech_lead',
      4: 'researcher',
      5: 'developer',
      6: 'validator',
      7: 'deployer'
    };
    return mapping[phase];
  }

  // ============================================================================
  // Checkpoint Management
  // ============================================================================

  async requestCheckpoint(type: CheckpointType, context?: string, partial = false): Promise<void> {
    const status = this.get();
    const expiryHours = status.config.checkpoint_expiry_by_type[type] 
      || status.config.checkpoint_expiry_hours;
    
    status.checkpoints.pending = true;
    status.checkpoints.type = type;
    status.checkpoints.requested_at = new Date().toISOString();
    status.checkpoints.expires_at = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
    status.checkpoints.context = context || null;
    status.checkpoints.partial = partial;
    
    status.phase.status = 'CHECKPOINT_PENDING';
    
    await this.save();
    await this.emit({ type: 'CHECKPOINT_REQUESTED', checkpointType: type });
  }

  async resolveCheckpoint(response: 'APPROVE' | 'REJECT' | 'DEFER', feedback?: string): Promise<void> {
    const status = this.get();
    
    if (!status.checkpoints.pending) {
      throw new Error('No pending checkpoint');
    }
    
    const historyEntry = {
      type: status.checkpoints.type!,
      requested_at: status.checkpoints.requested_at!,
      resolved_at: new Date().toISOString(),
      response,
      feedback
    };
    
    status.checkpoints.history.push(historyEntry);
    
    if (response === 'APPROVE') {
      status.metrics.checkpoints_approved++;
      status.checkpoints.pending = false;
      status.checkpoints.type = null;
      status.checkpoints.requested_at = null;
      status.checkpoints.expires_at = null;
      status.checkpoints.context = null;
      status.checkpoints.partial = false;
      status.checkpoints.partial_progress = null;
      
      await this.emit({ type: 'CHECKPOINT_APPROVED', checkpointType: historyEntry.type });
    } else if (response === 'REJECT') {
      status.metrics.checkpoints_rejected++;
      status.checkpoints.pending = false;
      status.phase.status = 'IN_PROGRESS';
      
      await this.emit({ type: 'CHECKPOINT_REJECTED', checkpointType: historyEntry.type, feedback: feedback || '' });
    }
    // DEFER keeps checkpoint pending
    
    await this.save();
  }

  isCheckpointExpired(): boolean {
    const status = this.get();
    if (!status.checkpoints.expires_at) return false;
    return new Date() > new Date(status.checkpoints.expires_at);
  }

  // ============================================================================
  // Halt Management
  // ============================================================================

  async halt(code: HaltCode, reason: string): Promise<void> {
    const status = this.get();
    
    status.halted = true;
    status.halt_code = code;
    status.halt_reason = reason;
    status.phase.status = 'HALTED';
    
    await this.save();
    await this.emit({ type: 'HALTED', code, reason });
  }

  async resume(justification?: string): Promise<void> {
    const status = this.get();
    
    if (!status.halted) {
      throw new Error('System is not halted');
    }
    
    // If HALT-003, reset fingerprint count
    if (status.halt_code === 'HALT-003' && justification) {
      // Find and reset the blocking fingerprint
      for (const [_fp, data] of Object.entries(status.errors.fingerprints)) {
        if (data.blocked) {
          data.count = 0;
          data.blocked = false;
        }
      }
    }
    
    status.halted = false;
    status.halt_code = null;
    status.halt_reason = null;
    status.phase.status = 'IN_PROGRESS';
    
    await this.save();
    await this.emit({ type: 'RESUMED' });
  }

  // ============================================================================
  // Error Management
  // ============================================================================

  async logError(error: Omit<ErrorEntry, 'id' | 'timestamp' | 'fingerprint' | 'retry_count' | 'status'>): Promise<ErrorEntry> {
    const status = this.get();
    
    // Generate fingerprint
    const fingerprint = createHash('md5')
      .update(`${error.category}:${error.phase}:${error.message}`)
      .digest('hex')
      .substring(0, 12);
    
    // Check fingerprint registry
    if (!status.errors.fingerprints[fingerprint]) {
      status.errors.fingerprints[fingerprint] = { count: 0, last_seen: '', blocked: false };
    }
    
    const fpData = status.errors.fingerprints[fingerprint];
    fpData.count++;
    fpData.last_seen = new Date().toISOString();
    
    // Check if should block
    const maxRetries = status.config.error_retry_by_severity[error.severity];
    if (fpData.count >= maxRetries) {
      fpData.blocked = true;
    }
    
    const entry: ErrorEntry = {
      ...error,
      id: `ERR-${String(status.errors.count + 1).padStart(4, '0')}`,
      timestamp: new Date().toISOString(),
      fingerprint,
      retry_count: fpData.count,
      max_retries: maxRetries,
      resolution: null,
      status: fpData.blocked ? 'BLOCKED' : 'OPEN'
    };
    
    status.errors.active.push(entry);
    status.errors.count++;
    status.metrics.errors_total++;
    
    await this.save();
    await this.emit({ type: 'ERROR_LOGGED', error: entry });
    
    // Auto-halt if blocked
    if (fpData.blocked) {
      await this.halt('HALT-003', `Error repeated ${fpData.count} times: ${error.message}`);
    }
    
    return entry;
  }

  async resolveError(errorId: string, resolution: string): Promise<void> {
    const status = this.get();
    const error = status.errors.active.find(e => e.id === errorId);
    
    if (!error) {
      throw new Error(`Error not found: ${errorId}`);
    }
    
    error.status = 'RESOLVED';
    error.resolution = resolution;
    status.metrics.errors_resolved++;
    
    // Remove from active
    status.errors.active = status.errors.active.filter(e => e.id !== errorId);
    
    await this.save();
  }

  // ============================================================================
  // Iteration Management
  // ============================================================================

  async applyIteration(feedback: string): Promise<number> {
    const status = this.get();
    
    if (status.iteration.iteration_count >= status.iteration.max_iterations) {
      throw new Error(`Maximum iterations (${status.iteration.max_iterations}) reached`);
    }
    
    status.iteration.active = true;
    status.iteration.feedback = feedback;
    status.iteration.iteration_count++;
    status.metrics.iterations_total++;
    
    await this.save();
    await this.emit({ type: 'ITERATION_APPLIED', count: status.iteration.iteration_count });
    
    return status.iteration.iteration_count;
  }

  // ============================================================================
  // Transition Recording
  // ============================================================================

  private async recordTransition(from: Phase, to: Phase, trigger: string): Promise<void> {
    const status = this.get();
    
    const entry: TransitionEntry = {
      timestamp: new Date().toISOString(),
      from_phase: from,
      to_phase: to,
      trigger,
      agent: status.agents.active || 'orchestrator',
      artifacts_modified: []
    };
    
    status.transitions.push(entry);
    await this.save();
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  isSessionStale(): boolean {
    const status = this.get();
    if (!status.session.last_active) return false;
    
    const lastActive = new Date(status.session.last_active);
    const staleThreshold = status.session.stale_threshold_hours * 60 * 60 * 1000;
    
    return Date.now() - lastActive.getTime() > staleThreshold;
  }

  async updateSession(action: string, resumePoint?: string): Promise<void> {
    const status = this.get();
    
    status.session.last_active = new Date().toISOString();
    status.session.last_action = action;
    if (resumePoint) {
      status.session.resume_point = resumePoint;
    }
    
    await this.save();
  }

  // ============================================================================
  // Progress Tracking
  // ============================================================================

  async updateProgress(_phase: Phase, key: string, value: unknown): Promise<void> {
    const status = this.get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (status.progress as any)[key] = value;
    await this.save();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(projectName: string): Promise<void> {
    const status = this.get();
    
    status.project.name = projectName;
    status.project.created = new Date().toISOString();
    status.project.updated = new Date().toISOString();
    status.project.version = '0.1.0';
    
    status.phase.current = 0;
    status.phase.status = 'AWAITING_HUMAN';
    
    status.session.last_active = new Date().toISOString();
    status.session.last_action = `Initialized project: ${projectName}`;
    
    await this.save();
  }
}

export default StateManager;
