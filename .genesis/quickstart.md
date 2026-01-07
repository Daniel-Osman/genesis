# Genesis Quick Reference

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

## CLI Commands

```bash
# Core commands
genesis status                    # Show current state
genesis init "My App"             # Start new project
genesis validate                  # Check phase completion
genesis checkpoint                # Request approval
genesis advance                   # Go to next phase

# Approval commands
genesis approve                   # Approve pending checkpoint
genesis reject "feedback"         # Reject with feedback

# Control commands
genesis iterate "feedback"        # Refine without rejection
genesis halt HALT-001 "reason"    # Stop system
genesis resume                    # Continue after halt
genesis rollback 3                # Go back to phase 3
genesis rollback 3 --dry-run      # Simulate rollback

# Observability commands
genesis metrics                   # Show performance dashboard
genesis metrics export json       # Export metrics (json/csv/md)
genesis soft-gates                # Show soft gate violations
genesis cache status              # Show research cache
genesis cache clear               # Clear research cache
```

## In-Chat Commands (IDE/LLM Integration)

| Command | What it does |
|---------|--------------|
| `GENESIS: STATUS` | Show current state |
| `GENESIS: INIT "name"` | Start new project |
| `GENESIS: VALIDATE` | Check phase completion |
| `GENESIS: CHECKPOINT` | Request approval |
| `GENESIS: CHECKPOINT PARTIAL` | Save partial progress |
| `GENESIS: ADVANCE` | Go to next phase |
| `GENESIS: ITERATE <feedback>` | Refine without rejection |
| `GENESIS: HALT <code>` | Stop system |
| `GENESIS: RESUME` | Continue after halt |
| `GENESIS: ROLLBACK <phase>` | Go back to phase |
| `GENESIS: ROLLBACK <phase> --dry-run` | Simulate rollback |
| `GENESIS: METRICS` | Show performance dashboard |
| `GENESIS: SOFT-GATES` | Show soft gate violations |

## Phases

```
1. Requirements  →  Product Owner  →  .spec/requirements.md
2. Design        →  Architect      →  .spec/design.md
3. Tasks         →  Tech Lead      →  .spec/tasks.md
4. Research      →  Researcher     →  docs/*
5. Implementation→  Developer      →  src/*
6. Validation    →  Validator      →  .spec/validation.md
7. Deployment    →  Deployer       →  .deploy/*
```

## Approval Responses

| Say | Effect |
|-----|--------|
| `APPROVE` | Move forward |
| `REJECT <reason>` | Fix and retry |
| `DEFER` | Pause for later |
| `ABORT` | Full stop |

## Halt Codes

| Code | Meaning |
|------|---------|
| HALT-001 | Validation failed |
| HALT-002 | Tried to skip phase |
| HALT-003 | Same error 3x |
| HALT-004 | Missing file |
| HALT-005 | Circular dependency |
| HALT-006 | Used unofficial source |
| HALT-007 | Approval rejected |
| HALT-008 | Tests failed |
| HALT-009 | Security issue |
| HALT-010 | Agent prompt not loaded |
| HALT-011 | Rollback failed |
| HALT-012 | Cache integrity failure |
| HALT-013 | Rollback verification failed |

## Quick Start Workflow

```bash
# 1. Initialize project
genesis init "My App"

# 2. Approve initialization
genesis approve

# 3. Work through phases
#    - Agent works on current phase
#    - Validate when ready
genesis validate

# 4. Request checkpoint
genesis checkpoint

# 5. Approve to advance
genesis approve

# 6. Repeat for each phase until deployment
```

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

## Tips

- **Stuck?** → `genesis status` to see where you are
- **Want changes?** → `genesis iterate "change X to Y"`
- **Long phase?** → `GENESIS: CHECKPOINT PARTIAL` to save progress
- **Made a mistake?** → `genesis rollback <phase>`
- **Session ended?** → System auto-resumes from last point
- **Distributed team?** → Increase `checkpoint_expiry_hours` in status.json
- **Research blocked?** → Enable `research_fallback_enabled` for alternatives
- **Check performance?** → `genesis metrics` for timing and bottlenecks
- **Non-critical warnings?** → `genesis soft-gates` to review
- **Test rollback?** → `genesis rollback <phase> --dry-run` first

## Configuration

Key settings in `.genesis/status.json` → `config`:

| Setting | Default | Description |
|---------|---------|-------------|
| `max_retries` | 3 | Max error retries before HALT-003 |
| `max_iterations` | 5 | Max iterations per phase |
| `checkpoint_expiry_hours` | 72 | Hours before approval expires |
| `session_stale_hours` | 48 | Hours before stale warning |
| `require_human_approval` | true | Require approval at checkpoints |
| `research_fallback_enabled` | true | Allow non-official doc sources |
| `soft_gate_policy` | warn_and_continue | How to handle soft gate violations |

See `governance.md` Section 12 for full configuration reference.

## File Locations

| What | Where |
|------|-------|
| State | `.genesis/status.json` |
| Errors | `.genesis/error.md` |
| Requirements | `.spec/requirements.md` |
| Design | `.spec/design.md` |
| Tasks | `.spec/tasks.md` |
| Research | `docs/<lib>/<feature>.md` |
| Code | `src/*` |
| Tests | `.spec/validation.md` |
| Deploy | `.deploy/*` |
