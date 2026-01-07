#!/usr/bin/env node
/**
 * Genesis Framework - CLI Interface
 * Command-line tool for Genesis commands
 * @version 1.0.0
 */

import { GenesisOrchestrator } from '../core/orchestrator';
import type { GenesisCommand, Phase, HaltCode, AgentName } from '../core/types';

const HELP_TEXT = `
Genesis Framework CLI

Usage: genesis <command> [options]

Commands:
  status                    Show current state
  init <name>               Initialize new project
  validate                  Validate current phase
  checkpoint [--partial]    Request approval checkpoint
  advance                   Move to next phase
  iterate <feedback>        Apply iteration feedback
  halt <code> <reason>      Halt system
  resume [justification]    Resume from halt
  rollback <phase> [--dry-run]  Rollback to phase
  agent <name>              Activate specific agent
  chunk <number>            Process artifact chunk
  cache clear [library]     Clear research cache
  cache status              Show cache status
  metrics                   Show metrics dashboard
  metrics export <format>   Export metrics (json|csv|md)
  soft-gates                Show soft gate violations
  approve [feedback]        Approve pending checkpoint
  reject <feedback>         Reject pending checkpoint
  defer                     Defer checkpoint review
  abort                     Abort project

Examples:
  genesis init "My SaaS App"
  genesis validate
  genesis checkpoint
  genesis approve
  genesis iterate "Add more detail to FR-1"
  genesis rollback 3 --dry-run
  genesis metrics export json

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
    case 'status':
      return { type: 'STATUS' };

    case 'init':
      if (!args[1]) {
        throw new Error('Project name required. Usage: genesis init "Project Name"');
      }
      return { type: 'INIT', name: args[1] };

    case 'validate':
      return { type: 'VALIDATE' };

    case 'checkpoint':
      return { type: 'CHECKPOINT', partial: args.includes('--partial') };

    case 'advance':
      return { type: 'ADVANCE' };

    case 'iterate':
      if (!args[1]) {
        throw new Error('Feedback required. Usage: genesis iterate "your feedback"');
      }
      return { type: 'ITERATE', feedback: args.slice(1).join(' ') };

    case 'halt':
      if (!args[1] || !args[2]) {
        throw new Error('Code and reason required. Usage: genesis halt HALT-001 "reason"');
      }
      return { type: 'HALT', code: args[1] as HaltCode, reason: args.slice(2).join(' ') };

    case 'resume':
      return { type: 'RESUME', justification: args[1] };

    case 'rollback':
      if (!args[1]) {
        throw new Error('Target phase required. Usage: genesis rollback <phase> [--dry-run]');
      }
      return { 
        type: 'ROLLBACK', 
        phase: parseInt(args[1]) as Phase,
        dryRun: args.includes('--dry-run')
      };

    case 'agent':
      if (!args[1]) {
        throw new Error('Agent name required. Usage: genesis agent <name>');
      }
      return { type: 'AGENT', name: args[1] as AgentName };

    case 'chunk':
      if (!args[1]) {
        throw new Error('Chunk number required. Usage: genesis chunk <number>');
      }
      return { type: 'CHUNK', number: parseInt(args[1]) };

    case 'cache':
      if (args[1] === 'clear') {
        return { type: 'CACHE_CLEAR', library: args[2] };
      } else if (args[1] === 'status') {
        return { type: 'CACHE_STATUS' };
      }
      throw new Error('Unknown cache command. Use: cache clear [library] | cache status');

    case 'metrics':
      if (args[1] === 'export') {
        if (!args[2] || !['json', 'csv', 'md'].includes(args[2])) {
          throw new Error('Format required. Usage: genesis metrics export <json|csv|md>');
        }
        return { type: 'METRICS_EXPORT', format: args[2] as 'json' | 'csv' | 'md' };
      }
      return { type: 'METRICS' };

    case 'soft-gates':
      return { type: 'SOFT_GATES' };

    case 'approve':
      return { type: 'APPROVE', feedback: args[1] };

    case 'reject':
      if (!args[1]) {
        throw new Error('Feedback required. Usage: genesis reject "your feedback"');
      }
      return { type: 'REJECT', feedback: args.slice(1).join(' ') };

    case 'defer':
      return { type: 'DEFER' };

    case 'abort':
      return { type: 'ABORT' };

    default:
      throw new Error(`Unknown command: ${cmd}. Run 'genesis help' for usage.`);
  }
}

main().catch(console.error);
