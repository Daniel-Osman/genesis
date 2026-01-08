# Genesis SaaS Factory

A production-grade SDLC framework that works hand-in-hand with AI-powered code editors to build complete SaaS applications through a structured 7-phase workflow.

[![CI/CD](https://github.com/genesis-framework/genesis/actions/workflows/ci.yml/badge.svg)](https://github.com/genesis-framework/genesis/actions)
[![npm version](https://badge.fury.io/js/genesis-framework.svg)](https://www.npmjs.com/package/genesis-framework)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Genesis provides **structure, orchestration, and guardrails** that turn AI-assisted coding into production-ready SaaS. It operates in **supervised mode** where humans maintain final decision authority at every phase transition.

### Key Principles

- **Human Supervision**: Every phase transition requires explicit human approval
- **Minimal Context**: Load agent context only when needed
- **Clear Audit Trail**: All decisions logged with timestamps and justifications
- **Structured Workflow**: 7 sequential phases with quality gates

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

```bash
# 1. Initialize project (awaits approval)
genesis init "My SaaS App"

# 2. Approve to begin Phase 1
genesis approve

# 3. Work on requirements, then validate
genesis validate

# 4. Request checkpoint when ready
genesis checkpoint

# 5. Approve to advance to Phase 2
genesis approve

# 6. Repeat for each phase until deployment
```

## The 7 Phases

| Phase | Agent | Output | Gate |
|-------|-------|--------|------|
| 1 | Product Owner | .spec/requirements.md | Requirements defined |
| 2 | Architect | .spec/design.md | Architecture complete |
| 3 | Tech Lead | .spec/tasks.md | Tasks breakdown ready |
| 4 | Researcher | docs/* | Documentation gathered |
| 5 | Developer | src/* | Code implemented |
| 6 | Validator | .spec/validation.md | Tests pass |
| 7 | Deployer | .deploy/* | Deployment ready |

## Commands

### Core Workflow
```bash
genesis status              # Show current state
genesis init "name"         # Initialize project
genesis validate            # Check phase completion
genesis checkpoint          # Request approval
genesis iterate "feedback"  # Refine current phase
```

### Human Control
```bash
genesis approve             # Approve → advance phase
genesis reject "feedback"   # Reject → revisions needed
genesis skip "reason"       # Force advance (logged)
genesis undo                # Return to previous phase
```

### System Control
```bash
genesis halt HALT-001 "reason"    # Stop system
genesis resume "justification"    # Resume from halt
genesis rollback 3                # Return to Phase 3
```

## In-Chat Commands (IDE Integration)

```
GENESIS: STATUS
GENESIS: INIT "Project Name"
GENESIS: VALIDATE
GENESIS: CHECKPOINT
APPROVE
REJECT "feedback"
SKIP "reason"
UNDO
```

## Workflow Diagram

```
INIT → [Human Approves] → Phase 1 → VALIDATE → CHECKPOINT → [Human Approves] → Phase 2 → ...
```

Every arrow marked `[Human Approves]` requires explicit human action.

## Halt Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| HALT-001 | Validation failed | Fix failures, re-validate |
| HALT-002 | Phase skip attempted | Use proper workflow |
| HALT-003 | Same error 3x | Human must investigate |
| HALT-004 | Required artifact missing | Create the artifact |
| HALT-005 | Security issue | Human must review |

## Programmatic Usage

```typescript
import { GenesisOrchestrator } from 'genesis-framework';

const orchestrator = new GenesisOrchestrator('./my-project');

// Execute commands
await orchestrator.execute({ type: 'STATUS' });
await orchestrator.execute({ type: 'INIT', name: 'My App' });
await orchestrator.execute({ type: 'APPROVE' });
await orchestrator.execute({ type: 'VALIDATE' });
await orchestrator.execute({ type: 'CHECKPOINT' });
```

## File Structure

```
.genesis/
  status.json          # State machine (single source of truth)
  system.md            # Orchestrator prompt
  quickstart.md        # Command reference
  prompts/             # Agent prompts (loaded on demand)
.spec/
  requirements.md      # Phase 1 output
  design.md            # Phase 2 output
  tasks.md             # Phase 3 output
  validation.md        # Phase 6 output
docs/                  # Phase 4 output (research)
src/                   # Phase 5 output (code)
.deploy/               # Phase 7 output (deployment)
```

## Configuration

Key settings in `.genesis/status.json`:

| Setting | Default | Description |
|---------|---------|-------------|
| `max_retries` | 3 | Error retries before HALT-003 |
| `max_iterations` | 5 | Refinements per phase |

## License

MIT
