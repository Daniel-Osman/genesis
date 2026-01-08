# Genesis Framework - Master Orchestrator

## Core Principle

**Every phase transition requires human approval.** Genesis operates in supervised mode where AI creates artifacts, validates work, and requests checkpoints—but humans control all advancement.

```
Human Request → AI Creates Artifacts → Validates → Checkpoint → Human Approves → Next Phase
```

## Session Protocol

On every session start:

1. **Read** `.genesis/status.json` - the single source of truth
2. **Report** current state (phase, status, pending actions)
3. **If checkpoint pending** → Remind human to APPROVE or REJECT
4. **If halted** → Explain halt reason and how to resume
5. **Load agent context** for current phase

## Workflow

```
INIT → [Human Approves] → Phase 1 → VALIDATE → CHECKPOINT → [Human Approves] → Phase 2 → ...
```

## Commands

| Command | Action |
|---------|--------|
| `GENESIS: STATUS` | Show current state from status.json |
| `GENESIS: INIT "name"` | Initialize new project, set phase 0, await approval |
| `GENESIS: VALIDATE` | Check current phase exit criteria |
| `GENESIS: CHECKPOINT` | Request human approval to advance |
| `GENESIS: ITERATE "feedback"` | Refine current phase with feedback |
| `APPROVE` | Advance to next phase (human only) |
| `REJECT "feedback"` | Return phase for revisions with feedback |
| `SKIP "reason"` | Force advance (logged, triggers HALT-002 warning) |
| `UNDO` | Return to previous phase |
| `GENESIS: LOAD_AGENT <phase>` | Load specific agent prompt into context |
| `GENESIS: LOAD_ARTIFACT <path>` | Load artifact file into context |
| `GENESIS: CONTEXT_STATUS` | Show context budget usage |
| `GENESIS: RESET_CONTEXT` | Clear loaded context |
| `GENESIS: HISTORY` | Show audit trail |

## Command Implementations

### GENESIS: STATUS
```
Read status.json and display:
- Project: {name} v{version}
- Phase: {current} - {label}
- Status: {status}
- Agent: {agent}
- Gates: [visual of locked/unlocked]
- Checkpoint: {pending status}
- Context: {total_lines}/{budget_lines} lines
```

### GENESIS: INIT "name"
```
1. Set project.name = name
2. Set project.created = timestamp
3. Set phase.current = 0
4. Set phase.status = "AWAITING_APPROVAL"
5. Set checkpoints.pending = true
6. Set checkpoints.type = "INIT"
7. Log to audit[]
8. Display: "Project initialized. Awaiting APPROVE to begin Phase 1."
```

### GENESIS: VALIDATE
```
1. Load current phase agent prompt
2. Check all exit criteria
3. If all pass:
   - Set checkpoints.validation_passed = true
   - Display: "✅ Validation passed. Run GENESIS: CHECKPOINT"
4. If any fail:
   - List failed criteria
   - Display: "❌ Validation failed. Address issues or GENESIS: ITERATE"
```

### GENESIS: CHECKPOINT
```
1. Require validation_passed = true
2. Set checkpoints.pending = true
3. Set checkpoints.type = "PHASE_COMPLETE"
4. Set checkpoints.requested_at = timestamp
5. Display: "🔒 Checkpoint requested. Awaiting human APPROVE or REJECT."
```

### APPROVE
```
1. Require checkpoints.pending = true
2. Unlock current gate
3. Set progress.phase_X_complete = true
4. Advance phase.current += 1
5. Set phase.status = "IN_PROGRESS"
6. Clear checkpoint
7. Load next agent
8. Log transition to audit[]
```

### REJECT "feedback"
```
1. Set iteration.feedback = feedback
2. Set iteration.count += 1
3. Clear checkpoint
4. Set phase.status = "REVISION_REQUESTED"
5. If iteration.count >= max_iterations → HALT-001
```

## Halt Codes

| Code | Trigger | Resolution |
|------|---------|------------|
| HALT-001 | Validation failed after max iterations | Human must SKIP or provide new direction |
| HALT-002 | Phase skip attempted | Logged warning, requires confirmation |
| HALT-003 | Same error occurred 3 times | Human intervention required |
| HALT-004 | Required artifact missing | Create artifact or SKIP with reason |
| HALT-005 | Security issue detected | Must resolve before continuing |

### Halt Handling
```
When halted:
1. Set halted = true
2. Set halt_reason = description
3. Set halt_code = code
4. Stop all processing
5. Display halt information
6. Await human command: SKIP "reason" or fix and GENESIS: VALIDATE
```

## Grounding Rules

Each phase is grounded in specific inputs to prevent hallucination:

| Phase | Ground In | Forbidden |
|-------|-----------|-----------|
| 1 - Requirements | User input only | Inventing features |
| 2 - Design | requirements.md | Adding unrequested components |
| 3 - Tasks | design.md | Creating undesigned work |
| 4 - Research | tasks.md + official docs | Unofficial sources |
| 5 - Implementation | tasks.md + docs/* | Unresearched libraries |
| 6 - Validation | src/* + requirements.md | Skipping tests |
| 7 - Deployment | validation.md | Deploying failed builds |

## Phase Flow

```
Phase 0: Initialization
    ↓ [APPROVE]
Phase 1: Requirements → .spec/requirements.md
    ↓ [VALIDATE → CHECKPOINT → APPROVE]
Phase 2: Design → .spec/design.md
    ↓ [VALIDATE → CHECKPOINT → APPROVE]
Phase 3: Tasks → .spec/tasks.md
    ↓ [VALIDATE → CHECKPOINT → APPROVE]
Phase 4: Research → docs/*
    ↓ [VALIDATE → CHECKPOINT → APPROVE]
Phase 5: Implementation → src/*
    ↓ [VALIDATE → CHECKPOINT → APPROVE]
Phase 6: Validation → .spec/validation.md
    ↓ [VALIDATE → CHECKPOINT → APPROVE]
Phase 7: Deployment → .deploy/*
    ↓ [VALIDATE → CHECKPOINT → APPROVE]
Complete ✓
```

## Agent Loading

When entering a phase, load the corresponding agent:

| Phase | Agent File |
|-------|------------|
| 1 | `.genesis/prompts/product_owner.md` |
| 2 | `.genesis/prompts/architect.md` |
| 3 | `.genesis/prompts/tech_lead.md` |
| 4 | `.genesis/prompts/researcher.md` |
| 5 | `.genesis/prompts/developer.md` |
| 6 | `.genesis/prompts/validator.md` |
| 7 | `.genesis/prompts/deployer.md` |

## Context Management

Track context budget to maintain efficiency:

```
context.prompt_lines = lines from agent prompts
context.artifacts_lines = lines from loaded artifacts
context.total_lines = prompt_lines + artifacts_lines
context.budget_lines = 2000 (configurable)

If total_lines > budget_lines * 0.8:
  Warn: "Context at 80% capacity"
  
If total_lines > budget_lines:
  Suggest: GENESIS: RESET_CONTEXT
```

## Audit Trail

All actions logged to audit[]:

```json
{
  "timestamp": "ISO-8601",
  "action": "COMMAND_NAME",
  "phase": 1,
  "agent": "product_owner",
  "details": {},
  "user": "human|ai"
}
```

## Error Handling

Track errors with fingerprints:

```
On error:
1. Generate fingerprint (hash of error type + location)
2. Check fingerprints[fingerprint]
3. If count >= 3 → HALT-003
4. Else increment and continue
```

## State Persistence

After every command:
1. Update status.json
2. Set session.last_active = timestamp
3. Set session.last_action = command

On session resume:
1. Read status.json
2. Restore full state
3. Report status
4. Continue from resume_point
