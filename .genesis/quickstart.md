# Genesis Framework - Quick Start

## What is Genesis?

Genesis is a prompt-based SDLC framework that guides AI-powered code editors through a supervised 7-phase workflow to build production-ready SaaS applications.

## Operating Model

Genesis operates in **supervised mode**:

```
Human Request → AI Creates Artifacts → Validates → Checkpoint → Human Approves → Next Phase
```

- AI does the work
- AI validates its own work against exit criteria
- AI requests checkpoints
- **Humans approve all phase transitions**

## Installation

Genesis is prompt-only. To install:

1. Copy the `.genesis/` folder to your project root
2. Ensure your AI editor can read markdown files
3. Start a session - the AI reads `system.md` automatically

## Commands

### Project Commands

| Command | Description |
|---------|-------------|
| `GENESIS: STATUS` | Show current project state |
| `GENESIS: INIT "name"` | Initialize a new project |
| `GENESIS: HISTORY` | Show audit trail of all actions |

### Phase Commands

| Command | Description |
|---------|-------------|
| `GENESIS: VALIDATE` | Check if current phase exit criteria are met |
| `GENESIS: CHECKPOINT` | Request approval to advance |
| `GENESIS: ITERATE "feedback"` | Refine current phase with feedback |

### Approval Commands (Human Only)

| Command | Description |
|---------|-------------|
| `APPROVE` | Approve checkpoint and advance to next phase |
| `REJECT "feedback"` | Reject and request revisions |
| `SKIP "reason"` | Force advance (logged, use sparingly) |
| `UNDO` | Return to previous phase |

### Context Commands

| Command | Description |
|---------|-------------|
| `GENESIS: LOAD_AGENT <phase>` | Load a specific agent prompt |
| `GENESIS: LOAD_ARTIFACT <path>` | Load an artifact into context |
| `GENESIS: CONTEXT_STATUS` | Show context budget usage |
| `GENESIS: RESET_CONTEXT` | Clear loaded context |

## The 7 Phases

| # | Phase | Agent | Output |
|---|-------|-------|--------|
| 1 | Requirements | Product Owner | `.spec/requirements.md` |
| 2 | Design | Architect | `.spec/design.md` |
| 3 | Tasks | Tech Lead | `.spec/tasks.md` |
| 4 | Research | Researcher | `docs/*` |
| 5 | Implementation | Developer | `src/*` |
| 6 | Validation | Validator | `.spec/validation.md` |
| 7 | Deployment | Deployer | `.deploy/*` |

## Context Budget

Genesis tracks context to maintain efficiency:

- **Budget:** 2000 lines (configurable)
- **Warning:** At 80% capacity
- **Action:** Use `GENESIS: RESET_CONTEXT` when full

## Halt Codes

| Code | Meaning |
|------|---------|
| HALT-001 | Validation failed after max iterations |
| HALT-002 | Phase skip attempted |
| HALT-003 | Same error occurred 3 times |
| HALT-004 | Required artifact missing |
| HALT-005 | Security issue detected |

When halted, the AI stops and awaits human intervention.

## Workflow Example

```
Human: "Build a todo app with user authentication"

AI: GENESIS: INIT "Todo App"
    → Project initialized. Awaiting APPROVE to begin Phase 1.

Human: APPROVE

AI: [Loads product_owner.md]
    [Gathers requirements from user input]
    [Creates .spec/requirements.md]
    
AI: GENESIS: VALIDATE
    → ✅ All exit criteria met

AI: GENESIS: CHECKPOINT
    → 🔒 Awaiting approval

Human: APPROVE

AI: [Advances to Phase 2]
    [Loads architect.md]
    [Creates .spec/design.md]
    
[...continues through all 7 phases...]
```

## File Locations

| Path | Purpose |
|------|---------|
| `.genesis/system.md` | Master orchestrator prompt |
| `.genesis/status.json` | State machine (source of truth) |
| `.genesis/quickstart.md` | This file |
| `.genesis/prompts/*.md` | Agent prompts |
| `.spec/*.md` | Specification artifacts |
| `docs/*` | Research documentation |
| `.deploy/*` | Deployment artifacts |
| `src/*` | Implementation code |

## Tips

1. **Be specific** in your initial request - it grounds all phases
2. **Review artifacts** before approving checkpoints
3. **Use ITERATE** to refine without restarting
4. **Check HISTORY** to understand decisions
5. **Trust the process** - each phase builds on the last
