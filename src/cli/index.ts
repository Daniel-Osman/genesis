#!/usr/bin/env node
/**
 * Genesis Framework - CLI Interface
 * Phases B, C, D: Context optimization, human control, editor integration
 * @version 2.0.0
 */

import { GenesisOrchestrator } from '../core/orchestrator';
import type { GenesisCommand, Phase, HaltCode } from '../core/types';

const HELP_TEXT = `
Genesis Framework CLI - Supervised Mode

Usage: genesis <command> [options]

CORE WORKFLOW:
  status                    Show current state and pending approvals
  init <name> [desc]        Initialize project (requires approval)
  validate                  Validate current phase artifacts
  checkpoint                Request human approval for phase completion
  iterate <feedback>        Refine current phase with feedback

HUMAN CONTROL (all phase transitions require these):
  approve [feedback]        Approve checkpoint → advance phase
  reject <feedback>         Reject checkpoint → return for revisions
  skip <reason>             Force advance despite issues (logged)
  undo                      Return to previous phase
  force <action> <reason>   Log forced action in audit trail
  override <gate> <reason>  Override specific gate status

SYSTEM CONTROL:
  halt <code> <reason>      Stop system with halt code
  resume <justification>    Resume from halt
  rollback <phase>          Rollback to specific phase (1-7)

CONTEXT MANAGEMENT:
  load-agent <phase>        Load agent context for phase
  load-artifact <path>      Load artifact into context
  context-status            Show context budget usage
  reset-context             Clear loaded context

AUDIT TRAIL:
  history                   Show full audit history

HALT CODES:
  HALT-001  Validation failed (hard gate)
  HALT-002  Phase skip attempted
  HALT-003  Repeated error (3x same issue)
  HALT-004  Required artifact missing
  HALT-005  Security issue detected

EXAMPLES:
  genesis init "My SaaS App"
  genesis validate
  genesis checkpoint
  genesis approve
  genesis reject "Need more detail on FR-1"
  genesis skip "MVP scope"
  genesis iterate "Add authentication requirements"
  genesis undo
  genesis rollback 2
  genesis load-agent 1
  genesis load-artifact .spec/requirements.md
  genesis history

WORKFLOW:
  1. init → approve → Phase 1 begins
  2. Work on phase artifacts
  3. validate → checkpoint → approve → Next phase
  4. Repeat until Phase 7 complete

For more information, see .genesis/quickstart.md
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const workspacePath = process.cwd();
  const orchestrator = new GenesisOrchestrator(workspacePath);

  try {
    const command = parseCommand(args);
    const result = await orchestrator.execute(command);
    
    console.log(result.message);
    
    if (!result.success) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function parseCommand(args: string[]): GenesisCommand {
  const cmd = args[0].toLowerCase();

  switch (cmd) {
    // Core Workflow
    case 'status':
      return { type: 'STATUS' };

    case 'init':
      if (!args[1]) {
        throw new Error('Project name required. Usage: genesis init "Project Name" [description]');
      }
      return { type: 'INIT', name: args[1], description: args[2] };

    case 'validate':
      return { type: 'VALIDATE' };

    case 'checkpoint':
      return { type: 'CHECKPOINT' };

    case 'iterate':
      if (!args[1]) {
        throw new Error('Feedback required. Usage: genesis iterate "your feedback"');
      }
      return { type: 'ITERATE', feedback: args.slice(1).join(' ') };

    // Human Control
    case 'approve':
      return { type: 'APPROVE', feedback: args[1] };

    case 'reject':
      if (!args[1]) {
        throw new Error('Feedback required. Usage: genesis reject "your feedback"');
      }
      return { type: 'REJECT', feedback: args.slice(1).join(' ') };

    case 'skip':
      if (!args[1]) {
        throw new Error('Reason required. Usage: genesis skip "reason for skipping"');
      }
      return { type: 'SKIP', reason: args.slice(1).join(' ') };

    case 'undo':
      return { type: 'UNDO' };

    case 'force':
      if (!args[1] || !args[2]) {
        throw new Error('Action and reason required. Usage: genesis force "action" "reason"');
      }
      return { type: 'FORCE', action: args[1], reason: args.slice(2).join(' ') };

    case 'override':
      if (!args[1] || !args[2]) {
        throw new Error('Gate and reason required. Usage: genesis override gate_1_requirements "reason"');
      }
      return { type: 'OVERRIDE', gate: args[1], reason: args.slice(2).join(' ') };

    // System Control
    case 'halt':
      if (!args[1] || !args[2]) {
        throw new Error('Code and reason required. Usage: genesis halt HALT-001 "reason"');
      }
      if (!['HALT-001', 'HALT-002', 'HALT-003', 'HALT-004', 'HALT-005'].includes(args[1])) {
        throw new Error('Invalid halt code. Valid codes: HALT-001 through HALT-005');
      }
      return { type: 'HALT', code: args[1] as HaltCode, reason: args.slice(2).join(' ') };

    case 'resume':
      if (!args[1]) {
        throw new Error('Justification required. Usage: genesis resume "justification"');
      }
      return { type: 'RESUME', justification: args.slice(1).join(' ') };

    case 'rollback':
      if (!args[1]) {
        throw new Error('Target phase required. Usage: genesis rollback <phase>');
      }
      const phase = parseInt(args[1]);
      if (isNaN(phase) || phase < 1 || phase > 7) {
        throw new Error('Phase must be a number between 1 and 7');
      }
      return { type: 'ROLLBACK', phase: phase as Phase };

    // Context Management
    case 'load-agent':
      if (!args[1]) {
        throw new Error('Phase required. Usage: genesis load-agent <phase>');
      }
      const agentPhase = parseInt(args[1]);
      if (isNaN(agentPhase) || agentPhase < 1 || agentPhase > 7) {
        throw new Error('Phase must be a number between 1 and 7');
      }
      return { type: 'LOAD_AGENT', phase: agentPhase as Phase };

    case 'load-artifact':
      if (!args[1]) {
        throw new Error('Path required. Usage: genesis load-artifact .spec/requirements.md');
      }
      return { type: 'LOAD_ARTIFACT', path: args[1] };

    case 'context-status':
      return { type: 'CONTEXT_STATUS' };

    case 'reset-context':
      return { type: 'RESET_CONTEXT' };

    // Audit Trail
    case 'history':
      return { type: 'HISTORY' };

    default:
      throw new Error(`Unknown command: ${cmd}. Run 'genesis help' for usage.`);
  }
}

main().catch(console.error);
