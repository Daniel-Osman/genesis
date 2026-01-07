/**
 * Genesis Framework - MCP Server
 * Model Context Protocol server for IDE integration
 * @version 1.0.0
 */

import { GenesisOrchestrator } from '../core/orchestrator';
import type { GenesisCommand, Phase, HaltCode } from '../core/types';

interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export class GenesisMCPServer {
  private orchestrator: GenesisOrchestrator;

  constructor(workspacePath: string) {
    this.orchestrator = new GenesisOrchestrator(workspacePath);
  }

  getTools(): MCPTool[] {
    return [
      {
        name: 'genesis_status',
        description: 'Get current Genesis framework status',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'genesis_init',
        description: 'Initialize a new Genesis project',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Project name' }
          },
          required: ['name']
        }
      },
      {
        name: 'genesis_validate',
        description: 'Validate current phase',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'genesis_checkpoint',
        description: 'Request approval checkpoint',
        inputSchema: {
          type: 'object',
          properties: {
            partial: { type: 'boolean', description: 'Create partial checkpoint' }
          }
        }
      },
      {
        name: 'genesis_advance',
        description: 'Advance to next phase',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'genesis_iterate',
        description: 'Apply iteration feedback',
        inputSchema: {
          type: 'object',
          properties: {
            feedback: { type: 'string', description: 'Feedback to apply' }
          },
          required: ['feedback']
        }
      },
      {
        name: 'genesis_approve',
        description: 'Approve pending checkpoint',
        inputSchema: {
          type: 'object',
          properties: {
            feedback: { type: 'string', description: 'Optional feedback' }
          }
        }
      },
      {
        name: 'genesis_reject',
        description: 'Reject pending checkpoint',
        inputSchema: {
          type: 'object',
          properties: {
            feedback: { type: 'string', description: 'Rejection feedback' }
          },
          required: ['feedback']
        }
      },
      {
        name: 'genesis_rollback',
        description: 'Rollback to previous phase',
        inputSchema: {
          type: 'object',
          properties: {
            phase: { type: 'number', description: 'Target phase (1-6)' },
            dryRun: { type: 'boolean', description: 'Simulate without executing' }
          },
          required: ['phase']
        }
      },
      {
        name: 'genesis_metrics',
        description: 'Get metrics dashboard',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'genesis_halt',
        description: 'Halt the system',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Halt code (HALT-001 to HALT-013)' },
            reason: { type: 'string', description: 'Halt reason' }
          },
          required: ['code', 'reason']
        }
      },
      {
        name: 'genesis_resume',
        description: 'Resume from halt',
        inputSchema: {
          type: 'object',
          properties: {
            justification: { type: 'string', description: 'Justification for resume' }
          }
        }
      }
    ];
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
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
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`
            }
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error'
        }
      };
    }
  }

  private async handleToolCall(request: MCPRequest): Promise<MCPResponse> {
    const params = request.params as { name: string; arguments?: Record<string, unknown> };
    const toolName = params.name;
    const args = params.arguments || {};

    let command: GenesisCommand;

    switch (toolName) {
      case 'genesis_status':
        command = { type: 'STATUS' };
        break;

      case 'genesis_init':
        command = { type: 'INIT', name: args.name as string };
        break;

      case 'genesis_validate':
        command = { type: 'VALIDATE' };
        break;

      case 'genesis_checkpoint':
        command = { type: 'CHECKPOINT', partial: args.partial as boolean };
        break;

      case 'genesis_advance':
        command = { type: 'ADVANCE' };
        break;

      case 'genesis_iterate':
        command = { type: 'ITERATE', feedback: args.feedback as string };
        break;

      case 'genesis_approve':
        command = { type: 'APPROVE', feedback: args.feedback as string };
        break;

      case 'genesis_reject':
        command = { type: 'REJECT', feedback: args.feedback as string };
        break;

      case 'genesis_rollback':
        command = { 
          type: 'ROLLBACK', 
          phase: args.phase as Phase,
          dryRun: args.dryRun as boolean
        };
        break;

      case 'genesis_metrics':
        command = { type: 'METRICS' };
        break;

      case 'genesis_halt':
        command = { 
          type: 'HALT', 
          code: args.code as HaltCode,
          reason: args.reason as string
        };
        break;

      case 'genesis_resume':
        command = { type: 'RESUME', justification: args.justification as string };
        break;

      default:
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32602,
            message: `Unknown tool: ${toolName}`
          }
        };
    }

    const result = await this.orchestrator.execute(command);

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [
          {
            type: 'text',
            text: result.message
          }
        ],
        isError: !result.success
      }
    };
  }
}

// Stdio transport for MCP
async function main(): Promise<void> {
  const workspacePath = process.cwd();
  const server = new GenesisMCPServer(workspacePath);

  process.stdin.setEncoding('utf8');
  
  let buffer = '';
  
  process.stdin.on('data', async (chunk: string) => {
    buffer += chunk;
    
    // Try to parse complete JSON-RPC messages
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
            error: {
              code: -32700,
              message: 'Parse error'
            }
          };
          process.stdout.write(JSON.stringify(errorResponse) + '\n');
        }
      }
    }
  });
}

if (require.main === module) {
  main().catch(console.error);
}

export default GenesisMCPServer;
