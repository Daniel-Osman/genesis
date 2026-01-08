/**
 * Genesis Framework - State Manager
 * Foundation Reset: Simplified state management with human-first control
 * @version 2.0.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import type { 
  GenesisStatus, 
  Phase, 
  AgentName,
  AgentContext,
  HaltCode,
  TransitionEntry,
  ErrorEntry,
  GenesisEvent,
  EventHandler,
  ApprovalResponse
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
      // Return default state if file doesn't exist
      this.status = this.getDefaultStatus();
      return this.status;
    }
  }

  async save(): Promise<void> {
    if (!this.status) {
      throw new Error('No status loaded');
    }
    
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

  private getDefaultStatus(): GenesisStatus {
    return {
      project: {
        name: null,
        description: null,
        created: null,
        updated: null,
        version: '0.1.0'
      },
      phase: {
        current: 0,
        status: 'NOT_INITIALIZED',
        labels: {
          0: 'Initialization',
          1: 'Requirements',
          2: 'Design',
          3: 'Tasks',
          4: 'Research',
          5: 'Implementation',
          6: 'Validation',
          7: 'Deployment'
        }
      },
      session: {
        last_active: null,
        resume_point: null,
        last_action: null
      },
      agent: null,
      context: {
        prompt_lines: 0,
        artifacts_lines: 0,
        total_lines: 0,
        budget_lines: 2000
      },
      gates: {
        gate_1_requirements: 'LOCKED',
        gate_2_design: 'LOCKED',
        gate_3_tasks: 'LOCKED',
        gate_4_research: 'LOCKED',
        gate_5_implementation: 'LOCKED',
        gate_6_validation: 'LOCKED',
        gate_7_deployment: 'LOCKED'
      },
      checkpoints: {
        pending: false,
        type: null,
        requested_at: null,
        context: null,
        validation_passed: false,
        history: []
      },
      progress: {
        phase_1_complete: false,
        phase_2_complete: false,
        phase_3_complete: false,
        phase_4_complete: false,
        phase_5_complete: false,
        phase_6_complete: false,
        phase_7_complete: false
      },
      halted: false,
      halt_reason: null,
      halt_code: null,
      errors: {
        active: [],
        count: 0,
        fingerprints: {}
      },
      transitions: [],
      audit: [],
      iteration: {
        count: 0,
        max: 5,
        feedback: null
      },
      config: {
        max_retries: 3,
        max_iterations: 5,
        halt_codes: ['HALT-001', 'HALT-002', 'HALT-003', 'HALT-004', 'HALT-005']
      }
    };
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
  // Initialization
  // ============================================================================

  async initialize(projectName: string, description?: string): Promise<void> {
    const status = this.get();
    
    status.project.name = projectName;
    status.project.description = description || null;
    status.project.created = new Date().toISOString();
    status.project.updated = new Date().toISOString();
    status.project.version = '0.1.0';
    
    status.phase.current = 0;
    status.phase.status = 'AWAITING_APPROVAL';
    
    status.session.last_active = new Date().toISOString();
    status.session.last_action = `Initialized project: ${projectName}`;
    
    // Request checkpoint for initialization - human must approve
    status.checkpoints.pending = true;
    status.checkpoints.type = 'PROJECT_INIT';
    status.checkpoints.requested_at = new Date().toISOString();
    status.checkpoints.context = `Initialize project "${projectName}"`;
    status.checkpoints.validation_passed = true; // Init is always valid
    
    await this.save();
    await this.emit({ type: 'INITIALIZED', project: projectName });
    await this.emit({ type: 'CHECKPOINT_REQUESTED', phase: 0 });
  }

  // ============================================================================
  // Phase Management - All transitions require human approval
  // ============================================================================

  async advancePhase(): Promise<Phase> {
    const status = this.get();
    const current = status.phase.current;
    
    if (current >= 7) {
      throw new Error('Already at final phase');
    }
    
    const next = (current + 1) as Phase;
    
    // Record transition with human approval
    const entry: TransitionEntry = {
      timestamp: new Date().toISOString(),
      from_phase: current,
      to_phase: next,
      trigger: 'APPROVE',
      approved_by: 'human'
    };
    status.transitions.push(entry);
    
    // Update phase
    status.phase.current = next;
    status.phase.status = 'IN_PROGRESS';
    
    // Update gates
    if (current > 0) {
      const currentGate = `gate_${current}_${this.getGateName(current)}`;
      status.gates[currentGate] = 'PASSED';
      
      // Mark phase complete
      const progressKey = `phase_${current}_complete` as keyof typeof status.progress;
      (status.progress as unknown as Record<string, boolean>)[progressKey] = true;
    }
    
    const nextGate = `gate_${next}_${this.getGateName(next)}`;
    status.gates[nextGate] = 'IN_PROGRESS';
    
    // Reset iteration count for new phase
    status.iteration.count = 0;
    status.iteration.feedback = null;
    
    // Clear checkpoint
    status.checkpoints.pending = false;
    status.checkpoints.type = null;
    status.checkpoints.requested_at = null;
    status.checkpoints.context = null;
    status.checkpoints.validation_passed = false;
    
    await this.save();
    await this.emit({ type: 'PHASE_CHANGED', from: current, to: next, approved_by: 'human' });
    
    return next;
  }

  async rollbackPhase(targetPhase: Phase): Promise<void> {
    const status = this.get();
    const current = status.phase.current;
    
    if (targetPhase >= current) {
      throw new Error(`Cannot rollback forward. Current: ${current}, Target: ${targetPhase}`);
    }
    
    if (targetPhase < 1) {
      throw new Error('Cannot rollback to Phase 0. Use INIT to restart.');
    }
    
    // Record transition
    const entry: TransitionEntry = {
      timestamp: new Date().toISOString(),
      from_phase: current,
      to_phase: targetPhase,
      trigger: 'UNDO',
      approved_by: 'human'
    };
    status.transitions.push(entry);
    
    // Reset gates for phases after target
    for (let p = targetPhase + 1; p <= 7; p++) {
      const gate = `gate_${p}_${this.getGateName(p as Phase)}`;
      status.gates[gate] = 'LOCKED';
      
      const progressKey = `phase_${p}_complete` as keyof typeof status.progress;
      (status.progress as unknown as Record<string, boolean>)[progressKey] = false;
    }
    
    // Set target phase to in progress
    status.phase.current = targetPhase;
    status.phase.status = 'IN_PROGRESS';
    status.gates[`gate_${targetPhase}_${this.getGateName(targetPhase)}`] = 'IN_PROGRESS';
    
    // Clear checkpoint
    status.checkpoints.pending = false;
    status.checkpoints.type = null;
    status.checkpoints.validation_passed = false;
    
    // Reset iteration
    status.iteration.count = 0;
    status.iteration.feedback = null;
    
    await this.save();
    await this.emit({ type: 'PHASE_CHANGED', from: current, to: targetPhase, approved_by: 'human' });
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
  // Agent Context Management - Load on demand
  // ============================================================================

  getAgentForPhase(phase: Phase): AgentName | null {
    const mapping: Record<Phase, AgentName | null> = {
      0: null,
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

  async loadAgentContext(phase: Phase): Promise<AgentContext | null> {
    const agentName = this.getAgentForPhase(phase);
    if (!agentName) return null;
    
    const promptPath = `.genesis/prompts/${agentName}.md`;
    const fullPath = path.join(this.workspacePath, promptPath);
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split('\n').length;
      
      const context: AgentContext = {
        name: agentName,
        phase,
        prompt_path: promptPath,
        loaded: true,
        prompt_lines: lines,
        artifacts_loaded: []
      };
      
      // Update context tracking
      const status = this.get();
      status.agent = context;
      status.context.prompt_lines = lines;
      status.context.total_lines = lines + status.context.artifacts_lines;
      
      await this.save();
      
      return context;
    } catch {
      return null;
    }
  }

  async loadArtifact(artifactPath: string): Promise<{ content: string; lines: number } | null> {
    const fullPath = path.join(this.workspacePath, artifactPath);
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split('\n').length;
      
      // Update context tracking
      const status = this.get();
      if (status.agent && !status.agent.artifacts_loaded.includes(artifactPath)) {
        status.agent.artifacts_loaded.push(artifactPath);
        status.context.artifacts_lines += lines;
        status.context.total_lines = status.context.prompt_lines + status.context.artifacts_lines;
        await this.save();
      }
      
      return { content, lines };
    } catch {
      return null;
    }
  }

  getContextBudgetStatus(): { used: number; budget: number; remaining: number; overBudget: boolean } {
    const status = this.get();
    const used = status.context.total_lines;
    const budget = status.context.budget_lines;
    return {
      used,
      budget,
      remaining: budget - used,
      overBudget: used > budget
    };
  }

  async resetContext(): Promise<void> {
    const status = this.get();
    status.agent = null;
    status.context.prompt_lines = 0;
    status.context.artifacts_lines = 0;
    status.context.total_lines = 0;
    await this.save();
  }

  // ============================================================================
  // Audit Trail
  // ============================================================================

  async logAudit(action: string, reason: string): Promise<void> {
    const status = this.get();
    status.audit.push({
      timestamp: new Date().toISOString(),
      action,
      phase: status.phase.current,
      reason,
      user: 'human'
    });
    await this.save();
  }

  async overrideGate(gate: string, reason: string): Promise<void> {
    const status = this.get();
    
    if (status.gates[gate]) {
      status.gates[gate] = 'PASSED';
      await this.logAudit(`OVERRIDE: ${gate}`, reason);
      await this.save();
    }
  }

  // ============================================================================
  // Checkpoint Management - Human approval required
  // ============================================================================

  async requestCheckpoint(validationPassed: boolean): Promise<void> {
    const status = this.get();
    
    status.checkpoints.pending = true;
    status.checkpoints.type = 'PHASE_COMPLETE';
    status.checkpoints.requested_at = new Date().toISOString();
    status.checkpoints.context = `Phase ${status.phase.current} - ${status.phase.labels[status.phase.current]}`;
    status.checkpoints.validation_passed = validationPassed;
    
    status.phase.status = 'PENDING_CHECKPOINT';
    
    await this.save();
    await this.emit({ type: 'CHECKPOINT_REQUESTED', phase: status.phase.current });
  }

  async resolveCheckpoint(response: ApprovalResponse, feedback?: string): Promise<void> {
    const status = this.get();
    
    if (!status.checkpoints.pending) {
      throw new Error('No pending checkpoint');
    }
    
    const historyEntry = {
      type: status.checkpoints.type!,
      phase: status.phase.current,
      requested_at: status.checkpoints.requested_at!,
      resolved_at: new Date().toISOString(),
      response,
      feedback
    };
    
    status.checkpoints.history.push(historyEntry);
    
    if (response === 'APPROVE') {
      await this.emit({ type: 'CHECKPOINT_APPROVED', phase: status.phase.current });
    } else if (response === 'REJECT') {
      status.checkpoints.pending = false;
      status.checkpoints.type = null;
      status.checkpoints.validation_passed = false;
      status.phase.status = 'IN_PROGRESS';
      
      await this.emit({ 
        type: 'CHECKPOINT_REJECTED', 
        phase: status.phase.current, 
        feedback: feedback || '' 
      });
    } else if (response === 'SKIP') {
      // Skip records the justification but advances anyway
      await this.emit({ type: 'CHECKPOINT_APPROVED', phase: status.phase.current });
    }
    
    await this.save();
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

  async resume(justification: string): Promise<void> {
    const status = this.get();
    
    if (!status.halted) {
      throw new Error('System is not halted');
    }
    
    // Reset error fingerprint if HALT-003
    if (status.halt_code === 'HALT-003') {
      for (const fp of Object.keys(status.errors.fingerprints)) {
        if (status.errors.fingerprints[fp].count >= status.config.max_retries) {
          status.errors.fingerprints[fp].count = 0;
        }
      }
    }
    
    status.halted = false;
    status.halt_code = null;
    status.halt_reason = null;
    status.phase.status = 'IN_PROGRESS';
    
    await this.save();
    await this.emit({ type: 'RESUMED', justification });
  }

  // ============================================================================
  // Error Management
  // ============================================================================

  async logError(error: Omit<ErrorEntry, 'id' | 'timestamp' | 'fingerprint' | 'retry_count'>): Promise<ErrorEntry> {
    const status = this.get();
    
    // Generate fingerprint
    const fingerprint = createHash('md5')
      .update(`${error.phase}:${error.message}`)
      .digest('hex')
      .substring(0, 12);
    
    // Track fingerprint
    if (!status.errors.fingerprints[fingerprint]) {
      status.errors.fingerprints[fingerprint] = { count: 0, last_seen: '' };
    }
    
    const fpData = status.errors.fingerprints[fingerprint];
    fpData.count++;
    fpData.last_seen = new Date().toISOString();
    
    const entry: ErrorEntry = {
      ...error,
      id: `ERR-${String(status.errors.count + 1).padStart(4, '0')}`,
      timestamp: new Date().toISOString(),
      fingerprint,
      retry_count: fpData.count
    };
    
    status.errors.active.push(entry);
    status.errors.count++;
    
    await this.save();
    
    // Auto-halt if same error repeated too many times
    if (fpData.count >= status.config.max_retries) {
      await this.halt('HALT-003', `Error repeated ${fpData.count} times: ${error.message}`);
    }
    
    return entry;
  }

  // ============================================================================
  // Iteration Management
  // ============================================================================

  async applyIteration(feedback: string): Promise<number> {
    const status = this.get();
    
    if (status.iteration.count >= status.iteration.max) {
      throw new Error(`Maximum iterations (${status.iteration.max}) reached. Request checkpoint or use SKIP.`);
    }
    
    status.iteration.count++;
    status.iteration.feedback = feedback;
    
    await this.save();
    
    return status.iteration.count;
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  async updateSession(action: string, resumePoint?: string): Promise<void> {
    const status = this.get();
    
    status.session.last_active = new Date().toISOString();
    status.session.last_action = action;
    if (resumePoint) {
      status.session.resume_point = resumePoint;
    }
    
    await this.save();
  }
}

export default StateManager;
