# Genesis Quick Reference

## Installation

```bash
npm install -g genesis-framework
# Or: npx genesis-framework status
```

---

## Operating Model: Supervised

All phase transitions require human approval.

```
AI → Creates artifacts → Validates → Requests checkpoint
Human → Reviews → APPROVE / REJECT / SKIP
```

---

## CLI Commands

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
genesis force "action" "reason"     # Log forced action
genesis override gate_1_requirements "reason"  # Override gate
```

### System Control
```bash
genesis halt HALT-001 "reason"    # Stop system
genesis resume "justification"    # Resume from halt
genesis rollback 3                # Return to Phase 3
```

### Context Management
```bash
genesis load-agent 1              # Load Phase 1 agent
genesis load-artifact .spec/requirements.md  # Load artifact
genesis context-status            # Show context budget
genesis reset-context             # Clear loaded context
```

### Audit Trail
```bash
genesis history                   # Show full audit history
```

---

## In-Chat Commands

| Command | Action |
|---------|--------|
| `GENESIS: STATUS` | Show current state |
| `GENESIS: INIT "name"` | Start new project |
| `GENESIS: VALIDATE` | Check phase completion |
| `GENESIS: CHECKPOINT` | Request approval |
| `APPROVE` | Approve checkpoint |
| `REJECT "feedback"` | Reject checkpoint |
| `SKIP "reason"` | Force advance |
| `UNDO` | Previous phase |
| `GENESIS: HISTORY` | Show audit trail |

---

## Phases

| # | Phase | Agent | Output |
|---|-------|-------|--------|
| 1 | Requirements | Product Owner | .spec/requirements.md |
| 2 | Design | Architect | .spec/design.md |
| 3 | Tasks | Tech Lead | .spec/tasks.md |
| 4 | Research | Researcher | docs/* |
| 5 | Implementation | Developer | src/* |
| 6 | Validation | Validator | .spec/validation.md |
| 7 | Deployment | Deployer | .deploy/* |

---

## Context Budget

Genesis tracks context usage to keep prompts efficient:

```
CONTEXT BUDGET:
  Prompt Lines: 50
  Artifact Lines: 200
  Total Used: 250 / 2000 lines
  Remaining: 1750 lines
```

Use `genesis reset-context` to clear and start fresh.

---

## Halt Codes

| Code | Meaning |
|------|---------|
| HALT-001 | Validation failed |
| HALT-002 | Phase skip attempted |
| HALT-003 | Same error 3x |
| HALT-004 | Required artifact missing |
| HALT-005 | Security issue |

---

## Workflow Example

```bash
# 1. Initialize
genesis init "Todo App"
genesis approve

# 2. Work on Phase 1
genesis load-agent 1
# ... create requirements.md ...
genesis validate
genesis checkpoint
genesis approve

# 3. Continue through phases
# ... repeat for each phase ...
```

---

## File Locations

| What | Where |
|------|-------|
| State | .genesis/status.json |
| Agent Prompts | .genesis/prompts/*.md |
| Requirements | .spec/requirements.md |
| Design | .spec/design.md |
| Tasks | .spec/tasks.md |
| Research | docs/* |
| Code | src/* |
| Validation | .spec/validation.md |
| Deployment | .deploy/* |
