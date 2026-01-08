/**
 * Genesis Framework - MCP Server
 * Phase D: Enhanced Editor Integration
 * @version 2.0.0
 */

import { GenesisOrchestrator } from '../core/orchestrator';
import type { GenesisCommand, Phase, HaltCode } from '../core/types';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface MCPRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
}

interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

class GenesisMCPServer {
  private orchestrator: GenesisOrchestrator;

  constructor(workspacePath: string) {
    this.orchestrator = new GenesisOrchestrator(workspacePath);
  }

  getTools(): MCPTool[] {
    return [
      // Core Workflow
      {
        name: 'genesis_status',
        description: 'Get current Genesis project status, phase, and pending approvals',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'genesis_init',
        description: 'Initialize a new Genesis project. Requires human APPROVE to begin Phase 1.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Project name' },
            description: { type: 'string', description: 'Project description (optional)' }
          },
          required: ['name']
        }
      },
      {
        name: 'genesis_validate',
        description: 'Validate current phase artifacts against quality gates',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'genesis_checkpoint',
        description: 'Request human approval for phase completion. Human must respond with APPROVE, REJECT, or SKIP.',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'genesis_iterate',
        description: 'Apply iteration feedback to refine current phase work',
        inputSchema: {
          type: 'object',
          properties: {
            feedback: { type: 'string', description: 'Iteration feedback' }
          },
          required: ['feedback']
        }
      },

      // Human Control
      {
        name: 'genesis_approve',
        description: 'Human approval - advances to next phase',
        inputSchema: {
          type: 'object',
          properties: {
            feedback: { type: 'string', description: 'Optional approval feedback' }
          }
        }
      },
      {
        name: 'genesis_reject',
        description: 'Human rejection - returns for revisions with feedback',
        inputSchema: {
          type: 'object',
          properties: {
            feedback: { type: 'string', description: 'Rejection feedback explaining what needs to change' }
          },
          required: ['feedback']
        }
      },
      {
        name: 'genesis_skip',
        description: 'Human override - force advance despite issues (logged in audit trail)',
        inputSchema: {
          type: 'object',
          properties: {
            reason: { type: 'string', description: 'Reason for skipping (required for audit)' }
          },
          required: ['reason']
        }
      },
      {
        name: 'genesis_undo',
        description: 'Return to previous phase',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'genesis_force',
        description: 'Log a forced action in the audit trail',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', description: 'Action being forced' },
            reason: { type: 'string', description: 'Reason for forcing' }
          },
          required: ['action', 'reason']
        }
      },
      {
        name: 'genesis_override',
        description: 'Override a specific gate status',
        inputSchema: {
          type: 'object',
          properties: {
            gate: { type: 'string', description: 'Gate name (e.g., gate_1_requirements)' },
            reason: { type: 'string', description: 'Reason for override' }
          },
          required: ['gate', 'reason']
        }
      },

      // System Control
      {
        name: 'genesis_halt',
        description: 'Halt the system with a specific code',
        inputSchema: {
          type: 'object',
          properties: {
            code: { 
              type: 'string', 
              enum: ['HALT-001', 'HALT-002', 'HALT-003', 'HALT-004', 'HALT-005'],
              description: 'Halt code'
            },
            reason: { type: 'string', description: 'Halt reason' }
          },
          required: ['code', 'reason']
        }
      },
      {
        name: 'genesis_resume',
        description: 'Resume from halt with justification',
        inputSchema: {
          type: 'object',
          properties: {
            justification: { type: 'string', description: 'Justification for resuming' }
          },
          required: ['justification']
        }
      },
      {
        name: 'genesis_rollback',
        description: 'Rollback to a specific phase',
        inputSchema: {
          type: 'object',
          properties: {
            phase: { type: 'number', minimum: 1, maximum: 7, description: 'Target phase (1-7)' }
          },
          required: ['phase']
        }
      },

      // Context Management
      {
        name: 'genesis_load_agent',
        description: 'Load agent context for a specific phase. Returns the agent prompt.',
        inputSchema: {
          type: 'object',
          properties: {
            phase: { type: 'number', minimum: 1, maximum: 7, description: 'Phase number (1-7)' }
          },
          required: ['phase']
        }
      },
      {
        name: 'genesis_load_artifact',
        description: 'Load a specific artifact file into context',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Artifact path (e.g., .spec/requirements.md)' }
          },
          required: ['path']
        }
      },
      {
        name: 'genesis_context_status',
        description: 'Show current context budget usage',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'genesis_reset_context',
        description: 'Clear all loaded context to free up budget',
        inputSchema: { type: 'object', properties: {} }
      },

      // Audit Trail
      {
        name: 'genesis_history',
        description: 'Show full audit history of checkpoints, transitions, and overrides',
        inputSchema: { type: 'object', properties: {} }
      }
    ];
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: { tools: {} },
              serverInfo: { 
                name: 'genesis-framework', 
                version: '2.0.0',
                description: 'Supervised SaaS Factory - Human approval required at every phase'
              }
            }
          };

        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: { tools: this.getTools() }
          };

        case 'tools/call':
          return this.handleToolCall(request);

        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: { code: -32601, message: `Method not found: ${request.method}` }
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32603, message: error instanceof Error ? error.message : 'Internal error' }
      };
    }
  }

  private async handleToolCall(request: MCPRequest): Promise<MCPResponse> {
    const toolName = request.params?.name;
    const args = request.params?.arguments || {};

    let command: GenesisCommand;

    switch (toolName) {
      // Core Workflow
      case 'genesis_status':
        command = { type: 'STATUS' };
        break;

      case 'genesis_init':
        command = { type: 'INIT', name: args.name as string, description: args.description as string };
        break;

      case 'genesis_validate':
        command = { type: 'VALIDATE' };
        break;

      case 'genesis_checkpoint':
        command = { type: 'CHECKPOINT' };
        break;

      case 'genesis_iterate':
        command = { type: 'ITERATE', feedback: args.feedback as string };
        break;

      // Human Control
      case 'genesis_approve':
        command = { type: 'APPROVE', feedback: args.feedback as string };
        break;

      case 'genesis_reject':
        command = { type: 'REJECT', feedback: args.feedback as string };
        break;

      case 'genesis_skip':
        command = { type: 'SKIP', reason: args.reason as string };
        break;

      case 'genesis_undo':
        command = { type: 'UNDO' };
        break;

      case 'genesis_force':
        command = { type: 'FORCE', action: args.action as string, reason: args.reason as string };
        break;

      case 'genesis_override':
        command = { type: 'OVERRIDE', gate: args.gate as string, reason: args.reason as string };
        break;

      // System Control
      case 'genesis_halt':
        command = { type: 'HALT', code: args.code as HaltCode, reason: args.reason as string };
        break;

      case 'genesis_resume':
        command = { type: 'RESUME', justification: args.justification as string };
        break;

      case 'genesis_rollback':
        command = { type: 'ROLLBACK', phase: args.phase as Phase };
        break;

      // Context Management
      case 'genesis_load_agent':
        command = { type: 'LOAD_AGENT', phase: args.phase as Phase };
        break;

      case 'genesis_load_artifact':
        command = { type: 'LOAD_ARTIFACT', path: args.path as string };
        break;

      case 'genesis_context_status':
        command = { type: 'CONTEXT_STATUS' };
        break;

      case 'genesis_reset_context':
        command = { type: 'RESET_CONTEXT' };
        break;

      // Audit Trail
      case 'genesis_history':
        command = { type: 'HISTORY' };
        break;

      default:
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32602, message: `Unknown tool: ${toolName}` }
        };
    }

    const result = await this.orchestrator.execute(command);

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{ type: 'text', text: result.message }],
        isError: !result.success,
        awaiting_approval: result.awaiting_approval
      }
    };
  }
}

async function main(): Promise<void> {
  const workspacePath = process.cwd();
  const server = new GenesisMCPServer(workspacePath);

  process.stdin.setEncoding('utf8');
  
  let buffer = '';
  
  process.stdin.on('data', async (chunk: string) => {
    buffer += chunk;
    
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const request = JSON.parse(line) as MCPRequest;
          const response = await server.handleRequest(request);
          process.stdout.write(JSON.stringify(response) + '\n');
        } catch (error) {
          const errorResponse: MCPResponse = {
            jsonrpc: '2.0',
            id: 0,
            error: { code: -32700, message: 'Parse error' }
          };
          process.stdout.write(JSON.stringify(errorResponse) + '\n');
        }
      }
    }
  });
}

main().catch(console.error);

export { GenesisMCPServer };
