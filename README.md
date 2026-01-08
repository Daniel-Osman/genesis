# Genesis SaaS Factory

A prompt-based SDLC framework designed for AI-powered code editors. Genesis provides **structure, orchestration, and guardrails** through a supervised 7-phase workflow where humans maintain final decision authority.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Genesis works hand-in-hand with AI-powered code editors (like Kiro, Cursor, Claude Dev) to build production-ready SaaS applications. It operates in **supervised mode** where the AI follows structured prompts and humans approve all phase transitions.

### Key Principles

- **Human Supervision**: Every phase transition requires explicit human approval
- **Prompt-Driven**: AI follows structured prompts, no code execution required
- **Clear Audit Trail**: All decisions logged with timestamps and justifications
- **Structured Workflow**: 7 sequential phases with quality gates

## Installation

Simply copy the Genesis framework into your project:

```bash
# Clone the framework
git clone https://github.com/genesis-framework/genesis.git
cd genesis

# Copy to your project
cp -r .genesis /path/to/your/project/
cp -r .spec /path/to/your/project/
mkdir -p /path/to/your/project/{docs,src,.deploy}
```

## Quick Start

1. **Initialize**: Tell your AI editor to read `.genesis/system.md`
2. **Begin**: AI will guide you through the 7-phase workflow
3. **Supervise**: Approve each phase transition when ready
4. **Deploy**: Complete SaaS application ready for production

## The 7 Phases

| Phase | Agent | Output | Human Approval Required |
|-------|-------|--------|------------------------|
| 1 | Product Owner | .spec/requirements.md | ✅ |
| 2 | Architect | .spec/design.md | ✅ |
| 3 | Tech Lead | .spec/tasks.md | ✅ |
| 4 | Researcher | docs/* | ✅ |
| 5 | Developer | src/* | ✅ |
| 6 | Validator | .spec/validation.md | ✅ |
| 7 | Deployer | .deploy/* | ✅ |

## How It Works

### For AI Editors

The AI reads `.genesis/system.md` which contains:
- Complete workflow instructions
- Phase-by-phase guidance
- Quality gates and validation criteria
- Context management rules

### For Humans

You maintain control by:
- Approving phase transitions
- Providing feedback and iterations
- Overriding decisions when needed
- Monitoring the audit trail

## File Structure

```
.genesis/
  status.json          # State machine (AI reads/writes this)
  system.md            # Main orchestrator prompt for AI
  quickstart.md        # Command reference
  prompts/             # Agent prompts for each phase
    product_owner.md   # Phase 1: Requirements
    architect.md       # Phase 2: Design  
    tech_lead.md       # Phase 3: Tasks
    researcher.md      # Phase 4: Research
    developer.md       # Phase 5: Implementation
    validator.md       # Phase 6: Validation
    deployer.md        # Phase 7: Deployment
.spec/
  requirements.md      # Phase 1 output
  design.md            # Phase 2 output
  tasks.md             # Phase 3 output
  validation.md        # Phase 6 output
docs/                  # Phase 4 output (research)
src/                   # Phase 5 output (code)
.deploy/               # Phase 7 output (deployment)
```

## Status Schema

The AI manages state through `.genesis/status.json`:

```json
{
  "project": { "name": "My App", "phase": 1 },
  "phase": { "current": 1, "status": "IN_PROGRESS" },
  "checkpoints": { "pending": false },
  "progress": { "phase_1_complete": false },
  "audit": []
}
```

## Human Commands

Communicate with your AI using these phrases:

```
GENESIS: STATUS                    # Show current state
GENESIS: INIT "Project Name"       # Initialize project
GENESIS: VALIDATE                  # Check phase completion
GENESIS: CHECKPOINT               # Request approval
APPROVE                           # Approve → advance phase
REJECT "feedback"                 # Reject → revisions needed
SKIP "reason"                     # Force advance (logged)
UNDO                             # Return to previous phase
```

## Workflow Example

```
Human: "GENESIS: INIT 'TaskFlow SaaS'"
AI: Creates project, loads Product Owner agent, awaits approval
Human: "APPROVE"
AI: Advances to Phase 2, loads Architect agent
Human: "GENESIS: VALIDATE"
AI: Checks design.md exists and meets criteria
Human: "GENESIS: CHECKPOINT"
AI: Requests approval for Phase 2 → Phase 3 transition
```

## Configuration

Key settings in `.genesis/status.json`:

| Setting | Default | Description |
|---------|---------|-------------|
| `max_retries` | 3 | Error retries before halt |
| `max_iterations` | 5 | Refinements per phase |
| `context.budget_lines` | 2000 | Context budget for AI |

## Halt Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| HALT-001 | Validation failed | Fix failures, re-validate |
| HALT-002 | Phase skip attempted | Use proper workflow |
| HALT-003 | Same error 3x | Human must investigate |
| HALT-004 | Required artifact missing | Create the artifact |
| HALT-005 | Security issue | Human must review |

## License

MIT