/**
 * Genesis Framework - Orchestrator Engine
 * Central controller implementing the agentic sequential pipeline
 * @version 1.0.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { StateManager } from './state-manager';
import { ValidationEngine } from './validator';
import { RollbackManager } from './rollback';
import { MetricsCollector } from './metrics';
import type { 
  GenesisCommand, 
  CommandResult, 
  Phase, 
  AgentName,
  HaltCode
} from './types';

export class GenesisOrchestrator {
  private stateManager: StateManager;
  private validator: ValidationEngine;
  private rollbackManager: RollbackManager;
  private metrics: MetricsCollector;
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
    this.stateManager = new StateManager(workspacePath);
    this.validator = new ValidationEngine(workspacePath);
    this.rollbackManager = new RollbackManager(workspacePath);
    this.metrics = new MetricsCollector(workspacePath);
  }

  // ============================================================================
  // Main Command Processor
  // ============================================================================

  async execute(command: GenesisCommand): Promise<CommandResult> {
    // Load current state
    await this.stateManager.load();
    const status = this.stateManager.get();

    // Check halt status (except for RESUME and STATUS commands)
    if (status.halted && command.type !== 'RESUME' && command.type !== 'STATUS') {
      return {
        success: false,
        message: `System halted: ${status.halt_code} - ${status.halt_reason}. Use GENESIS: RESUME to continue.`,
        halt: { code: status.halt_code!, reason: status.halt_reason! }
      };
    }

    // Route command
    switch (command.type) {
      case 'STATUS':
        return this.handleStatus();
      case 'INIT':
        return this.handleInit(command.name);
      case 'VALIDATE':
        return this.handleValidate();
      case 'CHECKPOINT':
        return this.handleCheckpoint(command.partial);
      case 'ADVANCE':
        return this.handleAdvance();
      case 'ITERATE':
        return this.handleIterate(command.feedback);
      case 'HALT':
        return this.handleHalt(command.code, command.reason);
      case 'RESUME':
        return this.handleResume(command.justification);
      case 'ROLLBACK':
        return this.handleRollback(command.phase, command.dryRun);
      case 'AGENT':
        return this.handleAgent(command.name);
      case 'CHUNK':
        return this.handleChunk(command.number);
      case 'CACHE_CLEAR':
        return this.handleCacheClear(command.library);
      case 'CACHE_STATUS':
        return this.handleCacheStatus();
      case 'METRICS':
        return this.handleMetrics();
      case 'METRICS_EXPORT':
        return this.handleMetricsExport(command.format);
      case 'SOFT_GATES':
        return this.handleSoftGates();
      case 'APPROVE':
        return this.handleApprove(command.feedback);
      case 'REJECT':
        return this.handleReject(command.feedback);
      case 'DEFER':
        return this.handleDefer();
      case 'ABORT':
        return this.handleAbort();
      default:
        return { success: false, message: 'Unknown command' };
    }
  }

  // ============================================================================
  // Command Handlers
  // ============================================================================

  private async handleStatus(): Promise<CommandResult> {
    const status = this.stateManager.get();
    const phaseLabel = status.phase.labels[status.phase.current];
    const agent = status.agents.active || 'none';
    
    let message = `
═══════════════════════════════════════════════════════════
                    GENESIS STATUS
═══════════════════════════════════════════════════════════

PROJECT: ${status.project.name || 'Not initialized'}
PHASE: ${status.phase.current} - ${phaseLabel}
STATUS: ${status.phase.status}
AGENT: ${agent} (${status.agents.sync.status})

SESSION:
  Last Active: ${status.session.last_active || 'Never'}
  Resume Point: ${status.session.resume_point || 'None'}
  Last Action: ${status.session.last_action || 'None'}

GATES:
${Object.entries(status.gates).map(([k, v]) => `  ${k}: ${v}`).join('\n')}

PROGRESS:
  Phase 1: ${status.progress.phase_1_requirements_drafted ? '✅' : '⚪'} Requirements
  Phase 2: ${status.progress.phase_2_components_total > 0 ? '✅' : '⚪'} Design (${status.progress.phase_2_components_designed.length}/${status.progress.phase_2_components_total})
  Phase 3: ${status.progress.phase_3_tasks_total > 0 ? '✅' : '⚪'} Tasks (${status.progress.phase_3_tasks_created.length}/${status.progress.phase_3_tasks_total})
  Phase 4: ${status.progress.phase_4_docs_total > 0 ? '✅' : '⚪'} Research (${status.progress.phase_4_docs_completed.length}/${status.progress.phase_4_docs_total})
  Phase 5: ${status.progress.phase_5_tasks_total > 0 ? '✅' : '⚪'} Implementation (${status.progress.phase_5_tasks_completed.length}/${status.progress.phase_5_tasks_total})
  Phase 6: ${status.progress.phase_6_tests_total > 0 ? '✅' : '⚪'} Validation (${status.progress.phase_6_tests_passed.length}/${status.progress.phase_6_tests_total})
  Phase 7: ${status.progress.phase_7_deployment_total > 0 ? '✅' : '⚪'} Deployment

ERRORS: ${status.errors.active.length} active
HALTED: ${status.halted ? `Yes (${status.halt_code})` : 'No'}
CHECKPOINT: ${status.checkpoints.pending ? `Pending (${status.checkpoints.type})` : 'None'}

═══════════════════════════════════════════════════════════`;

    // Check for stale session
    if (this.stateManager.isSessionStale()) {
      message += `\n\n⚠️ WARNING: Session inactive for >${status.session.stale_threshold_hours} hours`;
    }

    // Check for expired checkpoint
    if (this.stateManager.isCheckpointExpired()) {
      message += `\n\n⚠️ WARNING: Checkpoint expired. Run GENESIS: VALIDATE to refresh.`;
    }

    return { success: true, message, data: status };
  }

  private async handleInit(name: string): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (status.phase.current !== 0 || status.project.name !== null) {
      return { success: false, message: 'Project already initialized. Use GENESIS: ROLLBACK 0 to restart.' };
    }

    // Validate agent prompts if configured
    if (status.config.validate_prompts_on_init) {
      const promptValidation = await this.validator.validateAgentPrompts(status);
      if (!promptValidation.valid) {
        return {
          success: false,
          message: `Agent prompt validation failed:\n${promptValidation.errors.join('\n')}`
        };
      }
    }

    // Initialize project
    await this.stateManager.initialize(name);
    
    // Request checkpoint for initialization approval
    await this.stateManager.requestCheckpoint('PROJECT_INIT', `Initialize project: ${name}`);

    return {
      success: true,
      message: `Project "${name}" initialized.\n\nAwaiting approval to begin Phase 1 (Requirements).\nRespond with APPROVE to continue or REJECT <feedback> to cancel.`,
      checkpoint: { type: 'PROJECT_INIT', awaiting_approval: true }
    };
  }

  private async handleValidate(): Promise<CommandResult> {
    const status = this.stateManager.get();
    const result = await this.validator.validatePhase(status);

    // Evaluate soft gates
    const softGates = await this.validator.evaluateSoftGates(status);

    let message = `
═══════════════════════════════════════════════════════════
              VALIDATION RESULTS - Phase ${status.phase.current}
═══════════════════════════════════════════════════════════

OVERALL: ${result.passed ? '✅ PASSED' : '❌ FAILED'}

CRITERIA:
${result.criteria.map(c => `  ${c.passed ? '✅' : '❌'} [${c.severity.toUpperCase()}] ${c.id}: ${c.description}`).join('\n')}
`;

    if (result.hardFailures.length > 0) {
      message += `\nHARD FAILURES (must fix):\n${result.hardFailures.map(f => `  ❌ ${f}`).join('\n')}`;
    }

    if (result.softWarnings.length > 0) {
      message += `\nSOFT WARNINGS:\n${result.softWarnings.map(w => `  ⚠️ ${w}`).join('\n')}`;
    }

    if (softGates.warnings.length > 0) {
      message += `\nSOFT GATE WARNINGS:\n${softGates.warnings.map(w => `  ⚠️ ${w}`).join('\n')}`;
    }

    if (result.passed) {
      message += `\n\n✅ Ready for checkpoint. Run GENESIS: CHECKPOINT to request approval.`;
    } else {
      message += `\n\n❌ Fix hard failures before requesting checkpoint.`;
    }

    return { success: result.passed, message, data: result };
  }

  private async handleCheckpoint(partial = false): Promise<CommandResult> {
    const status = this.stateManager.get();

    // Validate first
    const validation = await this.validator.validatePhase(status);
    if (!validation.passed && !partial) {
      return {
        success: false,
        message: `Cannot checkpoint: validation failed.\n${validation.hardFailures.join('\n')}\n\nRun GENESIS: VALIDATE to see details.`
      };
    }

    const checkpointType = this.validator.getCheckpointTypeForPhase(status.phase.current);
    const context = partial 
      ? `Partial checkpoint for Phase ${status.phase.current}`
      : `Phase ${status.phase.current} complete`;

    await this.stateManager.requestCheckpoint(checkpointType, context, partial);

    if (partial) {
      this.stateManager.get().metrics.partial_checkpoints++;
    }

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
              CHECKPOINT REQUESTED
═══════════════════════════════════════════════════════════

Type: ${checkpointType}
Partial: ${partial ? 'Yes' : 'No'}
Phase: ${status.phase.current} - ${status.phase.labels[status.phase.current]}

Awaiting human approval.
Respond with:
  APPROVE - Proceed to next phase
  REJECT <feedback> - Return for revisions
  DEFER - Pause for later review

Checkpoint expires: ${status.checkpoints.expires_at}
═══════════════════════════════════════════════════════════`,
      checkpoint: { type: checkpointType, awaiting_approval: true }
    };
  }

  private async handleAdvance(): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (status.checkpoints.pending) {
      return { success: false, message: 'Cannot advance: checkpoint pending. Await approval first.' };
    }

    if (status.phase.current >= 7) {
      return { success: false, message: 'Already at final phase (Deployment).' };
    }

    // Update gate status
    const currentGate = `gate_${status.phase.current}_${this.getGateName(status.phase.current)}`;
    status.gates[currentGate] = 'PASSED';

    const newPhase = await this.stateManager.advancePhase();
    const newAgent = this.stateManager.getAgentForPhase(newPhase);

    // Activate and sync new agent
    await this.stateManager.activateAgent(newAgent);
    const syncResult = await this.stateManager.syncAgent(newAgent);

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
              ADVANCED TO PHASE ${newPhase}
═══════════════════════════════════════════════════════════

Phase: ${newPhase} - ${status.phase.labels[newPhase]}
Agent: ${newAgent}

Agent Context Loaded:
  - Agent: ${newAgent}
  - Prompt: ${status.agents.registry[newAgent].prompt}
  - Identity: ${syncResult.identity}
  - Status: SYNCED ✓

Ready to begin ${status.phase.labels[newPhase]} phase.
═══════════════════════════════════════════════════════════`
    };
  }

  private getGateName(phase: Phase): string {
    const names: Record<Phase, string> = {
      0: 'init', 1: 'requirements', 2: 'design', 3: 'tasks',
      4: 'research', 5: 'implementation', 6: 'validation', 7: 'deployment'
    };
    return names[phase];
  }

  private async handleIterate(feedback: string): Promise<CommandResult> {
    const status = this.stateManager.get();

    try {
      const count = await this.stateManager.applyIteration(feedback);
      
      await this.stateManager.updateSession(
        `Iteration ${count}: ${feedback.substring(0, 50)}...`,
        `Phase ${status.phase.current} iteration ${count}`
      );

      return {
        success: true,
        message: `
Iteration ${count}/${status.iteration.max_iterations} applied.

Feedback: ${feedback}

Continue working on Phase ${status.phase.current}.
${count >= status.iteration.max_iterations - 1 ? '\n⚠️ Approaching max iterations. Consider using REJECT for major changes.' : ''}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Iteration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async handleHalt(code: HaltCode, reason: string): Promise<CommandResult> {
    await this.stateManager.halt(code, reason);

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
                    SYSTEM HALTED
═══════════════════════════════════════════════════════════

Code: ${code}
Reason: ${reason}

The system has been halted. To resume:
1. Address the issue described above
2. Run GENESIS: RESUME with justification

═══════════════════════════════════════════════════════════`,
      halt: { code, reason }
    };
  }

  private async handleResume(justification?: string): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (!status.halted) {
      return { success: false, message: 'System is not halted.' };
    }

    // HALT-003 requires justification
    if (status.halt_code === 'HALT-003' && !justification) {
      return {
        success: false,
        message: 'HALT-003 requires justification. Run: GENESIS: RESUME "your justification"'
      };
    }

    await this.stateManager.resume(justification);

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
                    SYSTEM RESUMED
═══════════════════════════════════════════════════════════

Previous halt: ${status.halt_code}
${justification ? `Justification: ${justification}` : ''}

Continuing from Phase ${status.phase.current}.
Run GENESIS: STATUS to see current state.
═══════════════════════════════════════════════════════════`
    };
  }

  private async handleRollback(targetPhase: Phase, dryRun = false): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (targetPhase >= status.phase.current) {
      return { success: false, message: `Cannot rollback forward. Current phase: ${status.phase.current}` };
    }

    if (targetPhase < 1) {
      return { success: false, message: 'Cannot rollback to Phase 0. Use GENESIS: INIT to restart.' };
    }

    if (status.checkpoints.pending) {
      return { success: false, message: 'Cannot rollback with pending checkpoint. Resolve checkpoint first.' };
    }

    const impact = await this.rollbackManager.calculateImpact(status.phase.current, targetPhase);

    if (dryRun) {
      return {
        success: true,
        message: `
═══════════════════════════════════════════════════════════
              DRY-RUN: ROLLBACK TO PHASE ${targetPhase}
═══════════════════════════════════════════════════════════

From: Phase ${status.phase.current} → Phase ${targetPhase}

Files to archive (${impact.files.length} files):
${impact.files.map(f => `  - ${f}`).join('\n')}

Progress to reset:
${impact.progressReset.map(p => `  - ${p}`).join('\n')}

State changes:
  - phase.current: ${status.phase.current} → ${targetPhase}
  - Gates ${targetPhase + 1}-7: PASSED → LOCKED

Archive location: ${impact.archivePath}

NO CHANGES MADE. Run without --dry-run to execute.
═══════════════════════════════════════════════════════════`
      };
    }

    // Execute rollback
    await this.rollbackManager.execute(status.phase.current, targetPhase);

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
              ROLLBACK COMPLETE
═══════════════════════════════════════════════════════════

Rolled back from Phase ${status.phase.current} to Phase ${targetPhase}

Archived: ${impact.files.length} files
Location: ${impact.archivePath}

Current Phase: ${targetPhase} - ${status.phase.labels[targetPhase]}
Active Agent: ${this.stateManager.getAgentForPhase(targetPhase)}

Run GENESIS: STATUS to see current state.
═══════════════════════════════════════════════════════════`
    };
  }

  private async handleAgent(name: AgentName): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (!status.agents.registry[name]) {
      return { success: false, message: `Unknown agent: ${name}` };
    }

    await this.stateManager.activateAgent(name);
    const syncResult = await this.stateManager.syncAgent(name);

    return {
      success: true,
      message: `
Agent Context Loaded:
  - Agent: ${name}
  - Prompt: ${status.agents.registry[name].prompt}
  - Identity: ${syncResult.identity}
  - Phase: ${status.agents.registry[name].phase}
  - Status: SYNCED ✓`
    };
  }

  private async handleChunk(number: number): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (!status.context.chunking_enabled) {
      return { success: false, message: 'Chunking not enabled for current artifact.' };
    }

    if (number < 1 || (status.context.total_chunks && number > status.context.total_chunks)) {
      return { success: false, message: `Invalid chunk number. Valid range: 1-${status.context.total_chunks}` };
    }

    status.context.current_chunk = number;
    await this.stateManager.save();

    return {
      success: true,
      message: `Processing chunk ${number}/${status.context.total_chunks}`
    };
  }

  private async handleCacheClear(library?: string): Promise<CommandResult> {
    const status = this.stateManager.get();
    const cachePath = path.join(this.workspacePath, status.research_cache.cache_path);

    try {
      if (library) {
        const libPath = path.join(cachePath, library);
        await fs.rm(libPath, { recursive: true, force: true });
        return { success: true, message: `Cleared cache for library: ${library}` };
      } else {
        // Clear all except _index.json
        const entries = await fs.readdir(cachePath);
        for (const entry of entries) {
          if (entry !== '_index.json') {
            await fs.rm(path.join(cachePath, entry), { recursive: true, force: true });
          }
        }
        return { success: true, message: 'Cleared all cache entries' };
      }
    } catch (error) {
      return { success: false, message: `Cache clear failed: ${error}` };
    }
  }

  private async handleCacheStatus(): Promise<CommandResult> {
    const status = this.stateManager.get();
    const indexPath = path.join(this.workspacePath, status.research_cache.cache_path, '_index.json');

    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent);

      return {
        success: true,
        message: `
═══════════════════════════════════════════════════════════
              RESEARCH CACHE STATUS
═══════════════════════════════════════════════════════════

Enabled: ${status.research_cache.enabled}
TTL: ${status.research_cache.ttl_hours} hours
Path: ${status.research_cache.cache_path}

Statistics:
  Total Entries: ${index.statistics.total_entries}
  Valid: ${index.statistics.valid_entries}
  Expired: ${index.statistics.expired_entries}
  Size: ${Math.round(index.statistics.total_size_bytes / 1024)} KB
  Hit Rate: ${index.statistics.cache_hits}/${index.statistics.cache_hits + index.statistics.cache_misses} hits

Integrity: ${status.research_cache.integrity.status}
Last Verified: ${status.research_cache.integrity.last_verified || 'Never'}
═══════════════════════════════════════════════════════════`,
        data: index
      };
    } catch {
      return { success: true, message: 'Cache is empty or not initialized.' };
    }
  }

  private async handleMetrics(): Promise<CommandResult> {
    const dashboard = await this.metrics.generateDashboard();
    return { success: true, message: dashboard };
  }

  private async handleMetricsExport(format: 'json' | 'csv' | 'md'): Promise<CommandResult> {
    const exportPath = await this.metrics.export(format);
    return { success: true, message: `Metrics exported to: ${exportPath}` };
  }

  private async handleSoftGates(): Promise<CommandResult> {
    const status = this.stateManager.get();
    const softGates = await this.validator.evaluateSoftGates(status);

    let message = `
═══════════════════════════════════════════════════════════
              SOFT GATE STATUS
═══════════════════════════════════════════════════════════

Policy: ${status.soft_gates.policy}
Enabled: ${status.soft_gates.enabled}

Current Violations (${status.soft_gates.violations.length}):
${status.soft_gates.violations.length === 0 ? '  None' : status.soft_gates.violations.map(v => 
  `  ⚠️ ${v.rule}: ${v.actual}% (threshold: ${v.threshold}%) - ${v.acknowledged ? 'Acknowledged' : 'Pending'}`
).join('\n')}

Active Warnings:
${softGates.warnings.length === 0 ? '  None' : softGates.warnings.map(w => `  ⚠️ ${w}`).join('\n')}

Rules:
${Object.entries(status.soft_gates.rules).map(([rule, config]) => 
  `  ${rule}: ${config.severity} (threshold: ${config.threshold})`
).join('\n')}
═══════════════════════════════════════════════════════════`;

    return { success: true, message };
  }

  // ============================================================================
  // Approval Handlers
  // ============================================================================

  private async handleApprove(feedback?: string): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (!status.checkpoints.pending) {
      return { success: false, message: 'No pending checkpoint to approve.' };
    }

    const checkpointType = status.checkpoints.type!;
    await this.stateManager.resolveCheckpoint('APPROVE', feedback);

    // If not partial, advance to next phase
    if (!status.checkpoints.partial && status.phase.current < 7) {
      return this.handleAdvance();
    }

    return {
      success: true,
      message: `
✅ Checkpoint APPROVED: ${checkpointType}
${feedback ? `Feedback: ${feedback}` : ''}

${status.checkpoints.partial ? 'Continuing with remaining work...' : 'Ready to advance. Run GENESIS: ADVANCE to proceed.'}`
    };
  }

  private async handleReject(feedback: string): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (!status.checkpoints.pending) {
      return { success: false, message: 'No pending checkpoint to reject.' };
    }

    const checkpointType = status.checkpoints.type!;
    await this.stateManager.resolveCheckpoint('REJECT', feedback);

    return {
      success: true,
      message: `
❌ Checkpoint REJECTED: ${checkpointType}

Feedback: ${feedback}

Please address the feedback and run GENESIS: VALIDATE when ready.`
    };
  }

  private async handleDefer(): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (!status.checkpoints.pending) {
      return { success: false, message: 'No pending checkpoint to defer.' };
    }

    await this.stateManager.resolveCheckpoint('DEFER');

    return {
      success: true,
      message: `
⏸️ Checkpoint DEFERRED

The checkpoint remains pending for later review.
Expires: ${status.checkpoints.expires_at}

Resume review when ready.`
    };
  }

  private async handleAbort(): Promise<CommandResult> {
    await this.stateManager.halt('HALT-007', 'User aborted via ABORT command');

    return {
      success: true,
      message: `
🛑 PROJECT ABORTED

The system has been halted. To restart:
1. Run GENESIS: ROLLBACK 1 to return to requirements
2. Or GENESIS: INIT "new name" to start fresh

Use GENESIS: RESUME to continue from current state.`
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  async ensureDirectories(): Promise<void> {
    const dirs = [
      '.genesis',
      '.genesis/archive',
      '.genesis/prompts',
      '.spec',
      'docs',
      'docs/_cache',
      'src',
      '.deploy'
    ];

    for (const dir of dirs) {
      const fullPath = path.join(this.workspacePath, dir);
      await fs.mkdir(fullPath, { recursive: true });
    }
  }
}

export default GenesisOrchestrator;
