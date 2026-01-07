# Genesis SaaS Factory

A production-grade SDLC environment that transforms a blank session into a fully operational SaaS Software Factory using an Agentic Sequential Architecture.

[![CI/CD](https://github.com/genesis-framework/genesis/actions/workflows/ci.yml/badge.svg)](https://github.com/genesis-framework/genesis/actions)
[![npm version](https://badge.fury.io/js/genesis-framework.svg)](https://www.npmjs.com/package/genesis-framework)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Genesis is a deterministic, AI-assisted software development framework that guides projects through 7 sequential phases with human-in-the-loop checkpoints. Each phase is managed by a specialized AI agent with strict grounding rules to prevent hallucination.

## Installation

```bash
# Install globally
npm install -g genesis-framework

# Or use npx
npx genesis-framework status

# Or clone and build locally
git clone https://github.com/genesis-framework/genesis.git
cd genesis
npm install
npm run build
```

## Quick Start

### CLI Usage

```bash
# Initialize a new project
genesis init "My SaaS App"

# Check current status
genesis status

# Approve the initialization checkpoint
genesis approve

# Validate current phase work
genesis validate

# Request checkpoint for phase completion
genesis checkpoint

# View metrics dashboard
genesis metrics
```

### In-Chat Commands (IDE/LLM Integration)

```
GENESIS: INIT "Your Project Name"
GENESIS: STATUS
GENESIS: VALIDATE
GENESIS: CHECKPOINT
GENESIS: APPROVE
GENESIS: ITERATE "Add OAuth support to FR-1"
GENESIS: METRICS
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GENESIS ORCHESTRATOR                                 │
│                    (State Manager + Agent Router)                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   PHASE 1     │           │   PHASE 2     │           │   PHASE 3     │
│ Product Owner │ ────────► │   Architect   │ ────────► │  Tech Lead    │
│ (Requirements)│  GATE 1   │   (Design)    │  GATE 2   │   (Tasks)     │
└───────────────┘           └───────────────┘           └───────────────┘
                                                                │
        ┌───────────────────────────┬───────────────────────────┘
        ▼                           ▼                           
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   PHASE 4     │           │   PHASE 5     │           │   PHASE 6     │
│  Researcher   │ ────────► │   Developer   │ ────────► │   Validator   │
│(Documentation)│  GATE 3   │(Implementation)│  GATE 4   │   (QA/Test)   │
└───────────────┘           └───────────────┘           └───────────────┘
                                                                │
                                    ┌───────────────────────────┘
                                    ▼
                            ┌───────────────┐
                            │   PHASE 7     │
                            │   Deployer    │
                            │  (Release)    │
                            └───────────────┘
```

## Core Components

### Orchestrator Engine (`src/core/`)

| Module | Purpose |
|--------|---------|
| `orchestrator.ts` | Main command processor, routes all GENESIS commands |
| `state-manager.ts` | State persistence, phase transitions, event system |
| `validator.ts` | Quality gate validation for all 7 phases |
| `rollback.ts` | Safe rollback with archive verification |
| `metrics.ts` | Observability dashboard and metrics export |
| `types.ts` | Complete TypeScript type definitions |

### CLI (`src/cli/`)

Full command-line interface supporting all Genesis commands with help system.

### MCP Server (`src/mcp/`)

Model Context Protocol server for IDE integration with 12 exposed tools.

## Agent Taxonomy

| Agent | Phase | Input | Output | Grounding |
|-------|-------|-------|--------|-----------|
| Product Owner | 1 | User input | requirements.md | User statements only |
| Architect | 2 | requirements.md | design.md | Requirements only |
| Tech Lead | 3 | design.md | tasks.md | Design only |
| Researcher | 4 | tasks.md | docs/* | Official docs only |
| Developer | 5 | tasks.md + docs/* | src/* | Tasks + research |
| Validator | 6 | src/* + requirements.md | validation.md | Actual test results |
| Deployer | 7 | validation.md | .deploy/* | Validation report |

## Commands Reference

### Core Commands

| Command | CLI | Description |
|---------|-----|-------------|
| STATUS | `genesis status` | Show current state, phase, progress |
| INIT | `genesis init "name"` | Initialize new project |
| VALIDATE | `genesis validate` | Validate current phase criteria |
| CHECKPOINT | `genesis checkpoint` | Request human approval |
| ADVANCE | `genesis advance` | Move to next phase |
| APPROVE | `genesis approve` | Approve pending checkpoint |
| REJECT | `genesis reject "feedback"` | Reject with feedback |

### Control Commands

| Command | CLI | Description |
|---------|-----|-------------|
| ITERATE | `genesis iterate "feedback"` | Refine without rejection |
| HALT | `genesis halt HALT-001 "reason"` | Stop system |
| RESUME | `genesis resume` | Resume from halt |
| ROLLBACK | `genesis rollback 3` | Rollback to phase |
| ROLLBACK --dry-run | `genesis rollback 3 --dry-run` | Simulate rollback |

### Observability Commands

| Command | CLI | Description |
|---------|-----|-------------|
| METRICS | `genesis metrics` | Show dashboard |
| METRICS EXPORT | `genesis metrics export json` | Export metrics |
| SOFT-GATES | `genesis soft-gates` | Show soft gate violations |
| CACHE STATUS | `genesis cache status` | Show research cache |
| CACHE CLEAR | `genesis cache clear` | Clear research cache |

## Halt Codes

| Code | Trigger | Recovery |
|------|---------|----------|
| HALT-001 | Gate validation failed | Fix errors, re-validate |
| HALT-002 | Phase skip attempted | Return to correct phase |
| HALT-003 | Error repeated 3+ times | Manual intervention required |
| HALT-004 | Required artifact missing | Create missing artifact |
| HALT-005 | Circular dependency | Resolve dependency chain |
| HALT-006 | Non-official source used | Re-research from official docs |
| HALT-007 | Human approval rejected | Address feedback |
| HALT-008 | Critical test failure | Fix code, re-test |
| HALT-009 | Security vulnerability | Remediate before proceeding |
| HALT-010 | Agent context sync failed | Read agent prompt file |
| HALT-011 | Rollback failed | Resolve blocking conditions |
| HALT-012 | Cache integrity failure | Clear corrupted cache |
| HALT-013 | Rollback verification failed | Check archive integrity |

## Quality Gates

| Gate | Transition | Key Criteria |
|------|------------|--------------|
| Gate 1 | Requirements → Design | FR/NFR defined, acceptance criteria, priorities |
| Gate 2 | Design → Tasks | Architecture diagram, data model, API design |
| Gate 3 | Tasks → Research | Task IDs, traceability, no circular deps |
| Gate 4 | Research → Implementation | Official sources, version specified |
| Gate 5 | Implementation → Validation | Compiles, lint clean, tasks complete |
| Gate 6 | Validation → Deployment | Tests pass, security scan clean |

## Programmatic Usage

```typescript
import { GenesisOrchestrator } from 'genesis-framework';

const orchestrator = new GenesisOrchestrator('./my-project');

// Execute commands
const result = await orchestrator.execute({ type: 'STATUS' });
console.log(result.message);

// Initialize project
await orchestrator.execute({ type: 'INIT', name: 'My App' });

// Approve checkpoint
await orchestrator.execute({ type: 'APPROVE' });

// Validate and checkpoint
await orchestrator.execute({ type: 'VALIDATE' });
await orchestrator.execute({ type: 'CHECKPOINT' });

// Handle iteration
await orchestrator.execute({ 
  type: 'ITERATE', 
  feedback: 'Add OAuth support to authentication' 
});

// Rollback with dry-run
const impact = await orchestrator.execute({ 
  type: 'ROLLBACK', 
  phase: 3, 
  dryRun: true 
});
```

## MCP Server Integration

Genesis includes an MCP (Model Context Protocol) server for seamless IDE integration:

```json
{
  "mcpServers": {
    "genesis": {
      "command": "node",
      "args": ["node_modules/genesis-framework/dist/mcp/server.js"]
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `genesis_status` | Get current framework status |
| `genesis_init` | Initialize a new project |
| `genesis_validate` | Validate current phase |
| `genesis_checkpoint` | Request approval checkpoint |
| `genesis_advance` | Advance to next phase |
| `genesis_iterate` | Apply iteration feedback |
| `genesis_approve` | Approve pending checkpoint |
| `genesis_reject` | Reject pending checkpoint |
| `genesis_rollback` | Rollback to previous phase |
| `genesis_metrics` | Get metrics dashboard |
| `genesis_halt` | Halt the system |
| `genesis_resume` | Resume from halt |

## Project Structure

```
Genesis/
├── .genesis/               # Framework engine
│   ├── status.json         # State machine (single source of truth)
│   ├── system.md           # Master orchestrator prompt
│   ├── governance.md       # Quality gates, safety rules
│   ├── error.md            # Error tracking + fingerprints
│   ├── observability.md    # Metrics documentation
│   ├── quickstart.md       # Command reference
│   └── prompts/            # Agent personas
│       ├── product_owner.md
│       ├── architect.md
│       ├── tech_lead.md
│       ├── researcher.md
│       ├── developer.md
│       ├── validator.md
│       └── deployer.md
├── .spec/                  # Specification artifacts
│   ├── requirements.md     # Phase 1 output
│   ├── design.md           # Phase 2 output
│   ├── tasks.md            # Phase 3 output
│   ├── implementation.md   # Phase 5 log
│   └── validation.md       # Phase 6 report
├── docs/                   # Research documentation
│   └── _cache/             # Research cache
├── src/                    # Implementation code
│   ├── core/               # Orchestrator engine
│   ├── cli/                # Command-line interface
│   ├── mcp/                # MCP server
│   └── tests/              # Test suite
├── .deploy/                # Deployment artifacts
└── examples/               # Example projects
```

## Key Features

### Hallucination Prevention
Each agent has strict grounding rules - outputs must trace to inputs. The Researcher agent (Phase 4) can only use official documentation sources, with tiered confidence scoring.

### Human-in-the-Loop
Every phase transition requires explicit human approval via checkpoints. No autonomous advancement.

### Error Fingerprinting
Errors are tracked with fingerprints. Same error 3 times triggers HALT-003, preventing infinite loops.

### Session Persistence
Work is never lost. The system tracks last action, resume point, and partial progress. Sessions can be resumed after any interruption.

### Iteration Support
`GENESIS: ITERATE` allows refinement without full rejection cycle. Limited to 5 iterations per phase before requiring checkpoint.

### Partial Checkpoints
Long phases (Research, Implementation) support partial checkpoints to save incremental progress.

### Rollback with Verification
Safe rollback with archive integrity verification and `--dry-run` option to preview impact.

### Observability Dashboard
`GENESIS: METRICS` provides phase timing, agent performance, bottleneck detection, and failure pattern tracking.

### Soft Gates
Non-critical validations that warn without blocking. Configurable policies: warn_and_continue, warn_and_confirm, accumulate_and_block.

### Tiered Research Sources
5-tier confidence scoring (100% → 30%) for research sources. Reduces HALT-006 triggers while maintaining quality visibility.

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type check
npm run typecheck

# Lint
npm run lint

# Development mode (watch)
npm run dev
```

## Testing

The framework includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

Test coverage includes:
- STATUS, INIT, VALIDATE commands
- CHECKPOINT, APPROVE, REJECT flow
- HALT and RESUME functionality
- ITERATE command
- ROLLBACK with dry-run
- METRICS and SOFT_GATES
- CACHE operations

## Configuration

Key settings in `.genesis/status.json` → `config`:

| Setting | Default | Description |
|---------|---------|-------------|
| `max_retries` | 3 | Max error retries before HALT-003 |
| `max_iterations` | 5 | Max iterations per phase |
| `checkpoint_expiry_hours` | 72 | Hours before checkpoint expires |
| `session_stale_hours` | 48 | Hours before stale session warning |
| `require_human_approval` | true | Require approval at checkpoints |
| `research_fallback_enabled` | true | Allow fallback research sources |
| `soft_gate_policy` | warn_and_continue | Soft gate violation handling |

## Examples

See `examples/todo-app/` for a working example showing:
- Completed Phase 1 (requirements.md)
- In-progress Phase 2 (design.md)
- Proper status.json state

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT
