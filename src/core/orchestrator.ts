/**
 * Genesis Framework - Orchestrator Engine
 * Foundation Reset: Supervised-first control model
 * All phase transitions require human approval
 * @version 2.0.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { StateManager } from './state-manager';
import { ValidationEngine } from './validator';
import type { 
  GenesisCommand, 
  CommandResult, 
  Phase,
  HaltCode
} from './types';

export class GenesisOrchestrator {
  private stateManager: StateManager;
  private validator: ValidationEngine;
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
    this.stateManager = new StateManager(workspacePath);
    this.validator = new ValidationEngine(workspacePath);
  }

  // ============================================================================
  // Main Command Processor
  // ============================================================================

  async execute(command: GenesisCommand): Promise<CommandResult> {
    await this.stateManager.load();
    const status = this.stateManager.get();

    // Check halt status (except for RESUME and STATUS)
    if (status.halted && command.type !== 'RESUME' && command.type !== 'STATUS') {
      return {
        success: false,
        message: `⛔ System halted: ${status.halt_code}\n\nReason: ${status.halt_reason}\n\nUse GENESIS: RESUME "justification" to continue.`,
        halt: { code: status.halt_code!, reason: status.halt_reason! }
      };
    }

    switch (command.type) {
      case 'STATUS':
        return this.handleStatus();
      case 'INIT':
        return this.handleInit(command.name, command.description);
      case 'VALIDATE':
        return this.handleValidate();
      case 'CHECKPOINT':
        return this.handleCheckpoint();
      case 'ITERATE':
        return this.handleIterate(command.feedback);
      case 'APPROVE':
        return this.handleApprove(command.feedback);
      case 'REJECT':
        return this.handleReject(command.feedback);
      case 'SKIP':
        return this.handleSkip(command.reason);
      case 'UNDO':
        return this.handleUndo();
      case 'HALT':
        return this.handleHalt(command.code, command.reason);
      case 'RESUME':
        return this.handleResume(command.justification);
      case 'ROLLBACK':
        return this.handleRollback(command.phase);
      case 'LOAD_AGENT':
        return this.handleLoadAgent(command.phase);
      case 'LOAD_ARTIFACT':
        return this.handleLoadArtifact(command.path);
      case 'CONTEXT_STATUS':
        return this.handleContextStatus();
      case 'RESET_CONTEXT':
        return this.handleResetContext();
      case 'FORCE':
        return this.handleForce(command.action, command.reason);
      case 'OVERRIDE':
        return this.handleOverride(command.gate, command.reason);
      case 'HISTORY':
        return this.handleHistory();
      default:
        return { success: false, message: 'Unknown command' };
    }
  }

  // ============================================================================
  // Status Handler
  // ============================================================================

  private async handleStatus(): Promise<CommandResult> {
    const status = this.stateManager.get();
    const phaseLabel = status.phase.labels[status.phase.current];
    
    const gateDisplay = Object.entries(status.gates)
      .map(([k, v]) => {
        const icon = v === 'PASSED' ? '✅' : v === 'IN_PROGRESS' ? '🔄' : v === 'FAILED' ? '❌' : '🔒';
        return `  ${icon} ${k}: ${v}`;
      })
      .join('\n');

    const progressDisplay = Object.entries(status.progress)
      .map(([k, v]) => `  ${v ? '✅' : '⚪'} ${k.replace(/_/g, ' ')}`)
      .join('\n');

    let message = `
═══════════════════════════════════════════════════════════
                    GENESIS STATUS
═══════════════════════════════════════════════════════════

PROJECT: ${status.project.name || 'Not initialized'}
PHASE: ${status.phase.current} - ${phaseLabel}
STATUS: ${status.phase.status}

GATES:
${gateDisplay}

PROGRESS:
${progressDisplay}

SESSION:
  Last Active: ${status.session.last_active || 'Never'}
  Last Action: ${status.session.last_action || 'None'}

ERRORS: ${status.errors.active.length} active
HALTED: ${status.halted ? `Yes (${status.halt_code})` : 'No'}
ITERATIONS: ${status.iteration.count}/${status.iteration.max}
`;

    if (status.checkpoints.pending) {
      message += `
═══════════════════════════════════════════════════════════
⏳ CHECKPOINT PENDING - Awaiting human approval
   Type: ${status.checkpoints.type}
   Context: ${status.checkpoints.context}
   Validation: ${status.checkpoints.validation_passed ? '✅ Passed' : '⚠️ Not validated'}
   
   Respond with:
   • APPROVE - Proceed to next phase
   • REJECT "feedback" - Return for revisions
   • SKIP "reason" - Force advance (logged)
═══════════════════════════════════════════════════════════`;
    }

    return { success: true, message, data: status };
  }

  // ============================================================================
  // Initialization - Requires human approval
  // ============================================================================

  private async handleInit(name: string, description?: string): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (status.project.name !== null) {
      return { 
        success: false, 
        message: 'Project already initialized. Use GENESIS: ROLLBACK 1 to restart from requirements.' 
      };
    }

    // Ensure directories exist
    await this.ensureDirectories();

    // Initialize project - this requests a checkpoint
    await this.stateManager.initialize(name, description);

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
              PROJECT INITIALIZED
═══════════════════════════════════════════════════════════

Project: ${name}
${description ? `Description: ${description}` : ''}

⏳ AWAITING APPROVAL

Before beginning Phase 1 (Requirements), please confirm:
• Project name and scope are correct
• Ready to proceed with requirements gathering

Respond with:
  APPROVE - Begin Phase 1 (Requirements)
  REJECT "feedback" - Cancel and revise

═══════════════════════════════════════════════════════════`,
      awaiting_approval: true
    };
  }

  // ============================================================================
  // Validation Handler
  // ============================================================================

  private async handleValidate(): Promise<CommandResult> {
    const status = this.stateManager.get();
    
    if (status.phase.current === 0) {
      return { success: false, message: 'No phase to validate. Approve initialization first.' };
    }

    const result = await this.validator.validatePhase(status);

    let message = `
═══════════════════════════════════════════════════════════
        VALIDATION - Phase ${status.phase.current}: ${status.phase.labels[status.phase.current]}
═══════════════════════════════════════════════════════════

RESULT: ${result.passed ? '✅ PASSED' : '❌ FAILED'}

CRITERIA:
${result.criteria.map(c => `  ${c.passed ? '✅' : '❌'} [${c.required ? 'REQUIRED' : 'OPTIONAL'}] ${c.description}`).join('\n')}
`;

    if (result.failures.length > 0) {
      message += `
FAILURES (must fix):
${result.failures.map(f => `  ❌ ${f}`).join('\n')}
`;
    }

    if (result.warnings.length > 0) {
      message += `
WARNINGS:
${result.warnings.map(w => `  ⚠️ ${w}`).join('\n')}
`;
    }

    if (result.passed) {
      message += `
═══════════════════════════════════════════════════════════
✅ Ready for checkpoint. Run GENESIS: CHECKPOINT to request approval.
═══════════════════════════════════════════════════════════`;
    } else {
      message += `
═══════════════════════════════════════════════════════════
❌ Fix failures before requesting checkpoint.
   Use GENESIS: ITERATE "feedback" to refine.
═══════════════════════════════════════════════════════════`;
    }

    await this.stateManager.updateSession(`Validated Phase ${status.phase.current}: ${result.passed ? 'PASSED' : 'FAILED'}`);

    return { success: result.passed, message, data: result };
  }

  // ============================================================================
  // Checkpoint Handler - Requests human approval
  // ============================================================================

  private async handleCheckpoint(): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (status.phase.current === 0) {
      return { success: false, message: 'Cannot checkpoint Phase 0. Approve initialization first.' };
    }

    if (status.checkpoints.pending) {
      return { success: false, message: 'Checkpoint already pending. Respond with APPROVE, REJECT, or SKIP.' };
    }

    // Validate first
    const validation = await this.validator.validatePhase(status);
    
    // Request checkpoint (even if validation failed - human decides)
    await this.stateManager.requestCheckpoint(validation.passed);

    const phaseLabel = status.phase.labels[status.phase.current];

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
              CHECKPOINT REQUESTED
═══════════════════════════════════════════════════════════

Phase: ${status.phase.current} - ${phaseLabel}
Validation: ${validation.passed ? '✅ PASSED' : '⚠️ FAILED (human override available)'}

${!validation.passed ? `Validation Issues:\n${validation.failures.map(f => `  ❌ ${f}`).join('\n')}\n` : ''}
⏳ AWAITING HUMAN APPROVAL

Review the phase artifacts and respond with:
  APPROVE - Proceed to Phase ${status.phase.current + 1}
  REJECT "feedback" - Return for revisions
  SKIP "reason" - Force advance despite issues (logged)

═══════════════════════════════════════════════════════════`,
      awaiting_approval: true
    };
  }

  // ============================================================================
  // Human Control Handlers - Core of supervised model
  // ============================================================================

  private async handleApprove(feedback?: string): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (!status.checkpoints.pending) {
      return { success: false, message: 'No pending checkpoint to approve.' };
    }

    // Resolve checkpoint
    await this.stateManager.resolveCheckpoint('APPROVE', feedback);

    // Advance to next phase
    if (status.phase.current < 7) {
      const newPhase = await this.stateManager.advancePhase();
      const newLabel = status.phase.labels[newPhase];
      const agent = this.stateManager.getAgentForPhase(newPhase);

      return {
        success: true,
        message: `
═══════════════════════════════════════════════════════════
              ✅ APPROVED - ADVANCING
═══════════════════════════════════════════════════════════

${feedback ? `Feedback: ${feedback}\n` : ''}
Previous: Phase ${status.phase.current} - ${status.phase.labels[status.phase.current]} ✅
Current:  Phase ${newPhase} - ${newLabel}
Agent:    ${agent || 'None'}

Ready to begin ${newLabel} phase.
${agent ? `\nUse GENESIS: LOAD_AGENT ${newPhase} to load agent context.` : ''}

═══════════════════════════════════════════════════════════`
      };
    } else {
      // Project complete
      return {
        success: true,
        message: `
═══════════════════════════════════════════════════════════
              🎉 PROJECT COMPLETE
═══════════════════════════════════════════════════════════

All 7 phases completed and approved.

Project: ${status.project.name}
Total Transitions: ${status.transitions.length}
Total Iterations: ${status.iteration.count}

Artifacts created:
  • .spec/requirements.md
  • .spec/design.md
  • .spec/tasks.md
  • docs/*
  • src/*
  • .spec/validation.md
  • .deploy/*

═══════════════════════════════════════════════════════════`
      };
    }
  }

  private async handleReject(feedback: string): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (!status.checkpoints.pending) {
      return { success: false, message: 'No pending checkpoint to reject.' };
    }

    await this.stateManager.resolveCheckpoint('REJECT', feedback);

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
              ❌ REJECTED - REVISIONS NEEDED
═══════════════════════════════════════════════════════════

Phase: ${status.phase.current} - ${status.phase.labels[status.phase.current]}

Feedback: ${feedback}

Please address the feedback and:
1. Make necessary changes
2. Run GENESIS: VALIDATE to check
3. Run GENESIS: CHECKPOINT when ready

Iterations: ${status.iteration.count}/${status.iteration.max}

═══════════════════════════════════════════════════════════`
    };
  }

  private async handleSkip(reason: string): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (!status.checkpoints.pending) {
      return { success: false, message: 'No pending checkpoint to skip.' };
    }

    // Record skip with reason (for audit trail)
    await this.stateManager.resolveCheckpoint('SKIP', reason);

    // Advance despite issues
    if (status.phase.current < 7) {
      const newPhase = await this.stateManager.advancePhase();
      const newLabel = status.phase.labels[newPhase];

      return {
        success: true,
        message: `
═══════════════════════════════════════════════════════════
              ⚠️ SKIPPED - ADVANCING WITH OVERRIDE
═══════════════════════════════════════════════════════════

Phase: ${status.phase.current} - ${status.phase.labels[status.phase.current]}
Skip Reason: ${reason}

⚠️ This skip has been logged in the audit trail.

Now at: Phase ${newPhase} - ${newLabel}

═══════════════════════════════════════════════════════════`
      };
    }

    return { success: true, message: 'Skip recorded.' };
  }

  private async handleUndo(): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (status.phase.current <= 1) {
      return { success: false, message: 'Cannot undo from Phase 0 or 1. Use ROLLBACK for specific phase.' };
    }

    if (status.checkpoints.pending) {
      return { success: false, message: 'Cannot undo with pending checkpoint. Resolve checkpoint first.' };
    }

    const previousPhase = (status.phase.current - 1) as Phase;
    await this.stateManager.rollbackPhase(previousPhase);

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
              ↩️ UNDO - RETURNED TO PREVIOUS PHASE
═══════════════════════════════════════════════════════════

From: Phase ${status.phase.current} - ${status.phase.labels[status.phase.current]}
To:   Phase ${previousPhase} - ${status.phase.labels[previousPhase]}

Phase ${previousPhase} is now IN_PROGRESS.
Make changes and run GENESIS: VALIDATE when ready.

═══════════════════════════════════════════════════════════`
    };
  }

  // ============================================================================
  // Iteration Handler
  // ============================================================================

  private async handleIterate(feedback: string): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (status.checkpoints.pending) {
      return { success: false, message: 'Cannot iterate with pending checkpoint. Resolve checkpoint first.' };
    }

    try {
      const count = await this.stateManager.applyIteration(feedback);
      
      await this.stateManager.updateSession(
        `Iteration ${count}: ${feedback.substring(0, 50)}...`,
        `Phase ${status.phase.current} iteration ${count}`
      );

      return {
        success: true,
        message: `
Iteration ${count}/${status.iteration.max} applied.

Feedback: ${feedback}

Continue working on Phase ${status.phase.current} - ${status.phase.labels[status.phase.current]}.
Run GENESIS: VALIDATE when ready.
${count >= status.iteration.max - 1 ? '\n⚠️ Approaching max iterations. Consider CHECKPOINT or SKIP.' : ''}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Iteration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // ============================================================================
  // System Control Handlers
  // ============================================================================

  private async handleHalt(code: HaltCode, reason: string): Promise<CommandResult> {
    await this.stateManager.halt(code, reason);

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
                    ⛔ SYSTEM HALTED
═══════════════════════════════════════════════════════════

Code: ${code}
Reason: ${reason}

To resume:
1. Address the issue described above
2. Run: GENESIS: RESUME "justification for resuming"

═══════════════════════════════════════════════════════════`,
      halt: { code, reason }
    };
  }

  private async handleResume(justification: string): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (!status.halted) {
      return { success: false, message: 'System is not halted.' };
    }

    if (!justification) {
      return { success: false, message: 'Justification required. Run: GENESIS: RESUME "your justification"' };
    }

    await this.stateManager.resume(justification);

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
                    ✅ SYSTEM RESUMED
═══════════════════════════════════════════════════════════

Previous halt: ${status.halt_code}
Justification: ${justification}

Continuing from Phase ${status.phase.current} - ${status.phase.labels[status.phase.current]}.
Run GENESIS: STATUS to see current state.

═══════════════════════════════════════════════════════════`
    };
  }

  private async handleRollback(targetPhase: Phase): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (targetPhase >= status.phase.current) {
      return { success: false, message: `Cannot rollback forward. Current: ${status.phase.current}` };
    }

    if (targetPhase < 1) {
      return { success: false, message: 'Cannot rollback to Phase 0. Minimum is Phase 1.' };
    }

    if (status.checkpoints.pending) {
      return { success: false, message: 'Cannot rollback with pending checkpoint. Resolve checkpoint first.' };
    }

    await this.stateManager.rollbackPhase(targetPhase);

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
              ↩️ ROLLBACK COMPLETE
═══════════════════════════════════════════════════════════

From: Phase ${status.phase.current} - ${status.phase.labels[status.phase.current]}
To:   Phase ${targetPhase} - ${status.phase.labels[targetPhase]}

All progress after Phase ${targetPhase} has been reset.
Phase ${targetPhase} is now IN_PROGRESS.

Run GENESIS: STATUS to see current state.

═══════════════════════════════════════════════════════════`
    };
  }

  // ============================================================================
  // Agent Context Loading
  // ============================================================================

  private async handleLoadAgent(phase: Phase): Promise<CommandResult> {
    const context = await this.stateManager.loadAgentContext(phase);

    if (!context) {
      return { success: false, message: `No agent defined for Phase ${phase}.` };
    }

    // Read the prompt file to provide context
    const promptPath = path.join(this.workspacePath, context.prompt_path);
    
    try {
      const content = await fs.readFile(promptPath, 'utf-8');
      const budgetStatus = this.stateManager.getContextBudgetStatus();

      return {
        success: true,
        message: `
═══════════════════════════════════════════════════════════
              AGENT CONTEXT LOADED
═══════════════════════════════════════════════════════════

Agent: ${context.name}
Phase: ${context.phase} - ${this.stateManager.get().phase.labels[context.phase]}
Prompt: ${context.prompt_path}
Lines: ${context.prompt_lines}

CONTEXT BUDGET:
  Used: ${budgetStatus.used} / ${budgetStatus.budget} lines
  Remaining: ${budgetStatus.remaining} lines
  ${budgetStatus.overBudget ? '⚠️ OVER BUDGET' : '✅ Within budget'}

--- Agent Prompt ---
${content}
═══════════════════════════════════════════════════════════`
      };
    } catch {
      return {
        success: true,
        message: `Agent ${context.name} loaded for Phase ${phase}. Prompt file: ${context.prompt_path}`
      };
    }
  }

  private async handleLoadArtifact(artifactPath: string): Promise<CommandResult> {
    const result = await this.stateManager.loadArtifact(artifactPath);

    if (!result) {
      return { success: false, message: `Artifact not found: ${artifactPath}` };
    }

    const budgetStatus = this.stateManager.getContextBudgetStatus();

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
              ARTIFACT LOADED
═══════════════════════════════════════════════════════════

Path: ${artifactPath}
Lines: ${result.lines}

CONTEXT BUDGET:
  Used: ${budgetStatus.used} / ${budgetStatus.budget} lines
  Remaining: ${budgetStatus.remaining} lines
  ${budgetStatus.overBudget ? '⚠️ OVER BUDGET - Consider resetting context' : '✅ Within budget'}

--- Content ---
${result.content}
═══════════════════════════════════════════════════════════`
    };
  }

  private async handleContextStatus(): Promise<CommandResult> {
    const status = this.stateManager.get();
    const budgetStatus = this.stateManager.getContextBudgetStatus();

    const artifactsList = status.agent?.artifacts_loaded.length 
      ? status.agent.artifacts_loaded.map(a => `  - ${a}`).join('\n')
      : '  (none)';

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
              CONTEXT STATUS
═══════════════════════════════════════════════════════════

AGENT: ${status.agent?.name || 'None loaded'}
PROMPT: ${status.agent?.prompt_path || 'N/A'}

CONTEXT BUDGET:
  Prompt Lines: ${status.context.prompt_lines}
  Artifact Lines: ${status.context.artifacts_lines}
  Total Used: ${budgetStatus.used} / ${budgetStatus.budget} lines
  Remaining: ${budgetStatus.remaining} lines
  Status: ${budgetStatus.overBudget ? '⚠️ OVER BUDGET' : '✅ Within budget'}

LOADED ARTIFACTS:
${artifactsList}

Use GENESIS: RESET_CONTEXT to clear and start fresh.
═══════════════════════════════════════════════════════════`
    };
  }

  private async handleResetContext(): Promise<CommandResult> {
    await this.stateManager.resetContext();

    return {
      success: true,
      message: `
Context reset. All loaded artifacts cleared.
Use GENESIS: LOAD_AGENT <phase> to load agent context.`
    };
  }

  // ============================================================================
  // Human Control Enhancement - Force and Override
  // ============================================================================

  private async handleForce(action: string, reason: string): Promise<CommandResult> {
    await this.stateManager.logAudit(`FORCE: ${action}`, reason);

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
              ⚠️ FORCE ACTION LOGGED
═══════════════════════════════════════════════════════════

Action: ${action}
Reason: ${reason}
Timestamp: ${new Date().toISOString()}

This action has been logged in the audit trail.
Proceed with the forced action manually.

═══════════════════════════════════════════════════════════`
    };
  }

  private async handleOverride(gate: string, reason: string): Promise<CommandResult> {
    const status = this.stateManager.get();

    if (!status.gates[gate]) {
      const validGates = Object.keys(status.gates).join(', ');
      return { 
        success: false, 
        message: `Unknown gate: ${gate}\nValid gates: ${validGates}` 
      };
    }

    await this.stateManager.overrideGate(gate, reason);

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
              ⚠️ GATE OVERRIDE
═══════════════════════════════════════════════════════════

Gate: ${gate}
Previous Status: ${status.gates[gate]}
New Status: PASSED
Reason: ${reason}

This override has been logged in the audit trail.

═══════════════════════════════════════════════════════════`
    };
  }

  private async handleHistory(): Promise<CommandResult> {
    const status = this.stateManager.get();

    const checkpointHistory = status.checkpoints.history.length > 0
      ? status.checkpoints.history.map(h => 
          `  ${h.resolved_at} | Phase ${h.phase} | ${h.response}${h.feedback ? ` | "${h.feedback}"` : ''}`
        ).join('\n')
      : '  (none)';

    const transitionHistory = status.transitions.length > 0
      ? status.transitions.map(t => 
          `  ${t.timestamp} | Phase ${t.from_phase} → ${t.to_phase} | ${t.trigger}${t.reason ? ` | "${t.reason}"` : ''}`
        ).join('\n')
      : '  (none)';

    const auditHistory = status.audit.length > 0
      ? status.audit.map(a => 
          `  ${a.timestamp} | Phase ${a.phase} | ${a.action} | "${a.reason}"`
        ).join('\n')
      : '  (none)';

    return {
      success: true,
      message: `
═══════════════════════════════════════════════════════════
              AUDIT HISTORY
═══════════════════════════════════════════════════════════

CHECKPOINT HISTORY (${status.checkpoints.history.length}):
${checkpointHistory}

PHASE TRANSITIONS (${status.transitions.length}):
${transitionHistory}

AUDIT LOG (${status.audit.length}):
${auditHistory}

═══════════════════════════════════════════════════════════`
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  async ensureDirectories(): Promise<void> {
    const dirs = [
      '.genesis',
      '.genesis/prompts',
      '.spec',
      'docs',
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
