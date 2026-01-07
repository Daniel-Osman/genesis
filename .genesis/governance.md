# Genesis Framework - Governance Rules

## Purpose
This document defines the governance rules that ensure quality, safety, and correctness throughout the SDLC pipeline.

---

## 1. Quality Gates

### Gate 1: Requirements → Design
**Checkpoint:** `CHECKPOINT_REQ_COMPLETE`

| Criterion | Validation |
|-----------|------------|
| FR Coverage | At least 1 FR-X defined |
| NFR Coverage | At least 1 NFR-X defined |
| Acceptance Criteria | Every requirement has testable criteria |
| Prioritization | All requirements have priority (High/Medium/Low) |
| Scope Definition | Out of scope section populated |
| Traceability | Matrix initialized |

**Human Approval Required:** Yes

### Gate 2: Design → Tasks
**Checkpoint:** `CHECKPOINT_DESIGN_COMPLETE`

| Criterion | Validation |
|-----------|------------|
| Architecture | System diagram present |
| Components | All components mapped to requirements |
| Data Model | Entities and relationships defined |
| API Design | Endpoints documented with schemas |
| Tech Stack | All technologies specified |
| Security | Security considerations addressed |
| NFR Alignment | Design addresses all NFRs |

**Human Approval Required:** Yes

### Gate 3: Tasks → Research
**Checkpoint:** `CHECKPOINT_TASKS_COMPLETE`

| Criterion | Validation |
|-----------|------------|
| Task IDs | All tasks have unique Task X.Y ID |
| Traceability | All tasks link to FR-X/NFR-X |
| Docs Field | All tasks have Docs field (can be empty) |
| Estimates | All tasks have time estimates |
| Dependencies | No circular dependencies |
| Coverage | All design components have tasks |

**Human Approval Required:** Yes

### Gate 4: Research → Implementation
**Checkpoint:** `CHECKPOINT_RESEARCH_COMPLETE`

| Criterion | Validation |
|-----------|------------|
| Docs Populated | All task Docs fields have file paths |
| Files Exist | All referenced doc files exist |
| Official Sources | All docs cite official documentation |
| Version Specified | All docs include library version |
| No Hallucination | No content from training data |

**Human Approval Required:** Yes

### Gate 5: Implementation → Validation
**Checkpoint:** `CHECKPOINT_IMPL_COMPLETE`

| Criterion | Validation |
|-----------|------------|
| Code Exists | All task code files created |
| Compiles | No syntax errors |
| Lint Clean | No linting errors |
| Task Coverage | All tasks marked complete |
| Doc Reference | Code follows research docs |

**Human Approval Required:** Yes

### Gate 6: Validation → Deployment
**Checkpoint:** `CHECKPOINT_VALIDATION_COMPLETE`

| Criterion | Validation |
|-----------|------------|
| Unit Tests | All pass |
| Integration Tests | All pass |
| E2E Tests | Critical paths pass |
| Security Scan | No critical vulnerabilities |
| Performance | Meets NFR-1 criteria |
| Acceptance | All FR acceptance criteria verified |

**Human Approval Required:** Yes

---

## 2. Safety Rules

### 2.1 Secret Management
```
NEVER include in artifacts:
- API keys
- Passwords
- Connection strings
- Private keys
- Tokens

USE placeholders:
- ${API_KEY}
- ${DATABASE_URL}
- [REDACTED]
```

### 2.2 PII Protection
```
NEVER include in examples:
- Real names
- Email addresses
- Phone numbers
- Addresses
- SSN/ID numbers

USE generic placeholders:
- user@example.com
- John Doe
- 555-0100
```

### 2.3 Code Execution
```
NEVER execute:
- Untrusted user code
- Code from external URLs
- Obfuscated code

ALWAYS:
- Review before execution
- Sandbox when possible
- Log all executions
```

### 2.4 External Calls
```
LOG all:
- API calls
- Database queries
- File system operations
- Network requests

VALIDATE:
- URLs before fetching
- Inputs before processing
- Outputs before returning
```

---

## 3. Correctness Rules

### 3.1 Traceability
```
EVERY output must trace to input:
- Code → Task → Requirement
- Design decision → Requirement
- Test → Acceptance criteria
```

### 3.2 Documentation
```
EVERY decision must be documented:
- Why this approach?
- What alternatives considered?
- What trade-offs made?
```

### 3.3 Assumptions
```
EVERY assumption must be explicit:
- State in requirements.md
- Validate with human
- Track if invalidated
```

### 3.4 Versioning
```
EVERY change must be versioned:
- Increment project.version
- Log in transitions
- Note in artifacts
```

---

## 4. Hallucination Mitigation

### 4.1 Grounding Requirements
| Phase | Grounding Source |
|-------|------------------|
| 1 - Requirements | User input only |
| 2 - Design | requirements.md + user input |
| 3 - Tasks | design.md + requirements.md |
| 4 - Research | Official documentation only |
| 5 - Implementation | tasks.md + docs/* |
| 6 - Validation | src/* + requirements.md |
| 7 - Deployment | validation.md + config |

### 4.2 Prohibited Actions
```
NEVER:
- Invent requirements user didn't state
- Assume technical decisions without design
- Generate code without task reference
- Cite documentation from memory
- Create test data with real patterns
```

### 4.3 Verification Protocol
```
BEFORE outputting:
1. Can I cite the source?
2. Is this grounded in an artifact?
3. Did the user explicitly request this?
4. Am I making assumptions?

IF any answer is NO → ASK for clarification
```

---

## 5. Human-in-the-Loop Checkpoints

### 5.1 Mandatory Checkpoints
| Checkpoint | Phase Transition | Approval Required |
|------------|------------------|-------------------|
| PROJECT_INIT | 0 → 1 | Yes |
| REQ_COMPLETE | 1 → 2 | Yes |
| DESIGN_COMPLETE | 2 → 3 | Yes |
| TASKS_COMPLETE | 3 → 4 | Yes |
| RESEARCH_COMPLETE | 4 → 5 | Yes |
| IMPL_COMPLETE | 5 → 6 | Yes |
| VALIDATION_COMPLETE | 6 → 7 | Yes |
| DEPLOY_READY | 7 → Done | Yes |

### 5.2 Checkpoint Protocol
```yaml
1. Agent completes phase work
2. GENESIS: VALIDATE runs
3. If validation passes:
   a. GENESIS: CHECKPOINT triggered
   b. System presents:
      - Summary of work done
      - Artifacts created/modified
      - Validation results
      - Request for approval
   c. Human reviews and responds:
      - APPROVE: Proceed to next phase
      - REJECT: Provide feedback
      - DEFER: Pause for later review
4. If REJECT:
   a. Log feedback
   b. Iterate on current phase
   c. Re-submit for checkpoint
```

### 5.3 Approval Responses
| Response | Action |
|----------|--------|
| `APPROVE` | Advance to next phase |
| `REJECT <feedback>` | Log feedback, iterate |
| `DEFER` | Pause, await later review |
| `ABORT` | Halt system, require restart |

### 5.4 Iteration Protocol (Within Phase)
For minor adjustments without full rejection:

```yaml
GENESIS: ITERATE <feedback>

1. Validate iteration count < max_iterations (5)
2. Log feedback to iteration.feedback
3. Increment iteration.iteration_count
4. Apply changes to current phase artifact
5. Update session.last_action
6. Continue work (no checkpoint required)

If iteration_count >= max_iterations:
  - Warn: "Maximum iterations reached"
  - Suggest: Use REJECT for major changes
  - Or: GENESIS: CHECKPOINT to formalize progress
```

### 5.5 Partial Checkpoints
For long phases (4-Research, 5-Implementation):

```yaml
GENESIS: CHECKPOINT PARTIAL

1. Save current progress:
   - Phase 4: progress.phase_4_docs_completed
   - Phase 5: progress.phase_5_tasks_completed
2. Set checkpoint.partial = true
3. Set checkpoint.partial_progress = "[X/Y] items"
4. Request human approval
5. On APPROVE: Continue with remaining work
6. On REJECT: Address feedback, continue

Benefits:
- Saves work if session ends
- Allows incremental review
- Reduces risk of losing progress
```

### 5.6 Checkpoint Expiration
```yaml
Checkpoints expire based on type (configurable in status.json):

Default expiry by checkpoint type:
  PROJECT_INIT: 24 hours        # Quick decision needed
  REQ_COMPLETE: 72 hours        # Standard review
  DESIGN_COMPLETE: 72 hours     # Standard review
  TASKS_COMPLETE: 48 hours      # Faster turnaround
  RESEARCH_COMPLETE: 48 hours   # Faster turnaround
  IMPL_COMPLETE: 96 hours       # Extended for code review
  VALIDATION_COMPLETE: 48 hours # Faster turnaround
  DEPLOY_COMPLETE: 24 hours     # Quick decision needed

On checkpoint creation:
  1. Get checkpoint type
  2. Look up expiry in config.checkpoint_expiry_by_type[type]
  3. Fall back to config.checkpoint_expiry_hours if not found
  4. Set checkpoint.expires_at = now() + expiry_hours

On expiration:
  1. checkpoint.pending = false
  2. Log: "Checkpoint expired, re-validation required"
  3. Must run GENESIS: VALIDATE again
  4. Then GENESIS: CHECKPOINT for new approval
```

### 5.7 Iteration vs. Rejection Decision Guide
```yaml
Use GENESIS: ITERATE when:
  ✅ Fixing typos, formatting, naming
  ✅ Adding missing details to existing items
  ✅ Clarifying ambiguous language
  ✅ Correcting minor factual errors
  ✅ Adjusting estimates or priorities
  ✅ Expanding acceptance criteria
  
  Characteristics:
  - Does not change scope
  - Quick refinement (< 30 minutes)
  - No re-validation needed
  - Limited to max_iterations (5)

Use REJECT <feedback> when:
  ❌ Adding or removing requirements
  ❌ Changing architectural decisions
  ❌ Restructuring task dependencies
  ❌ Modifying technology stack
  ❌ Significant scope changes
  
  Characteristics:
  - Changes scope or direction
  - Requires re-validation
  - May invalidate downstream work
  - Triggers full checkpoint cycle
```

---

## 6. Error Governance

### 6.1 Error Classification
| Severity | Action | Auto-Halt |
|----------|--------|-----------|
| CRITICAL | Immediate halt | Yes |
| ERROR | Log, attempt recovery | After 3 retries |
| WARNING | Log, continue | No |
| INFO | Log only | No |

### 6.2 Error Fingerprinting
```
Fingerprint = hash(error_type + phase + context)

Track:
- First occurrence
- Total count
- Last message

Block after 3 occurrences of same fingerprint
```

### 6.3 Recovery Protocol
```yaml
1. Error occurs
2. Log to .genesis/error.md
3. Check fingerprint registry
4. If count >= 3:
   a. HALT-003 triggered
   b. Require manual intervention
5. If count < 3:
   a. Attempt recovery
   b. Increment count
   c. Continue if successful
```

---

## 7. Audit Trail

### 7.1 What Gets Logged
- All state transitions
- All checkpoint requests/responses
- All errors
- All agent activations
- All artifact modifications
- All iterations
- Session start/end times

### 7.2 Log Format
```yaml
- timestamp: ISO-8601
  event: EVENT_TYPE
  phase: [0-7]
  agent: [agent_name]
  action: [description]
  input: [summary]
  output: [summary]
  status: [SUCCESS|FAILURE]
  metadata: {}
```

### 7.3 Retention
- Keep all logs for project lifetime
- Archive on project completion
- Never delete error logs

---

## 8. Context Management

### 8.1 Context Size Limits
```yaml
max_lines_per_artifact: 500

If artifact exceeds limit:
  1. Enable chunking: context.chunking_enabled = true
  2. Split into chunks of ~400 lines
  3. Process sequentially with GENESIS: CHUNK <n>
  4. Summarize previous chunks when processing next
```

### 8.2 Chunking Protocol
```yaml
For large artifacts (tasks.md, design.md):

1. Calculate chunks:
   total_chunks = ceil(lines / 400)
   
2. Process each chunk:
   GENESIS: CHUNK 1  # Process lines 1-400
   GENESIS: CHUNK 2  # Process lines 401-800, with summary of chunk 1
   
3. Track in status.json:
   context.current_chunk = 2
   context.total_chunks = 3
   
4. On completion:
   context.current_chunk = null
   context.chunking_enabled = false
```

### 8.3 Context Minimization
Each agent receives ONLY:
- Its persona prompt (~500 lines max)
- Required input artifacts (chunked if needed)
- Current state summary (not full status.json)
- Relevant error context (if any)

---

## 9. Session Persistence

### 9.1 Session Tracking
```yaml
On every action, update:
  session.last_active: [timestamp]
  session.last_action: "[description]"
  session.resume_point: "[specific location]"
  session.last_artifact_modified: "[path]"
```

### 9.2 Stale Session Detection
```yaml
stale_threshold_hours: 48  # Configurable in status.json

On session start:
  1. Read session.last_active
  2. Read config.session_stale_hours (default: 48)
  3. Calculate hours_since = now - last_active
  4. If hours_since > stale_threshold:
     - Warn: "Session inactive for [X] hours"
     - Ask: "Continue from [resume_point]? (yes/restart)"
  5. If checkpoint.pending and checkpoint.expires_at < now:
     - Warn: "Pending checkpoint expired"
     - Require: GENESIS: VALIDATE to refresh
```

### 9.3 Resume Protocol
```yaml
On session resume:
  1. Report current state
  2. Show resume_point
  3. Show partial progress (if any):
     - Phase 4: "[X/Y] docs completed"
     - Phase 5: "[X/Y] tasks completed"
  4. Ask: "Continue from [resume_point]?"
  5. On yes: Load appropriate agent, continue
  6. On no: Show options (rollback, restart, etc.)
```

### 9.4 Progress Persistence
```yaml
Phase 1 (Requirements):
  progress.phase_1_requirements_drafted: true/false
  progress.phase_1_requirements_validated: true/false

Phase 2 (Design):
  progress.phase_2_components_designed: ["Auth Service", "User API", ...]
  progress.phase_2_components_total: 8

Phase 3 (Tasks):
  progress.phase_3_tasks_created: ["Task 1.1", "Task 1.2", ...]
  progress.phase_3_tasks_total: 25

Phase 4 (Research):
  progress.phase_4_docs_completed: ["docs/react/useState.md", ...]
  progress.phase_4_docs_total: 15

Phase 5 (Implementation):
  progress.phase_5_tasks_completed: ["Task 1.1", "Task 1.2", ...]
  progress.phase_5_tasks_total: 20

Phase 6 (Validation):
  progress.phase_6_tests_passed: ["TC-001", "TC-002", ...]
  progress.phase_6_tests_total: 30

Phase 7 (Deployment):
  progress.phase_7_deployment_steps: ["pre-check", "backup", "migrate", ...]
  progress.phase_7_deployment_total: 6

On resume:
  - Skip completed items
  - Continue from first incomplete
  - Report: "[X/Y] items completed in current phase"
```

---

## 10. Agent Context Sync Protocol

### 10.1 Mandatory Sync (NEVER SKIP)
```yaml
BEFORE any phase work begins:

1. Read status.json
2. Get active agent: agents.active
3. Get prompt path: agents.registry[active].prompt
4. EXECUTE read_file(prompt_path) - THIS IS MANDATORY
5. Parse loaded prompt for:
   - ## Agent Identity section
   - ## Activation Condition section
6. Verify activation condition matches:
   - phase.current matches expected phase
   - agents.active matches agent name
7. Update agents.sync:
   - status: "SYNCED"
   - last_synced: now()
   - prompt_loaded: [path]
   - identity_verified: true
8. Output confirmation (REQUIRED):
   
   "Agent Context Loaded:
    - Agent: [name from prompt]
    - Prompt: [file path]
    - Identity: [first sentence of Agent Identity]
    - Expected Phase: [from Activation Condition]
    - Current Phase: [from status.json]
    - Status: SYNCED ✓"
```

### 10.2 Sync Failure (HALT-010)
```yaml
Triggers:
- read_file on prompt path fails
- Prompt file missing or empty
- ## Agent Identity section not found
- ## Activation Condition not found
- Phase mismatch between prompt and status.json
- Sync step skipped entirely

On HALT-010:
1. System halts immediately
2. Log error with details
3. Report:
   "HALT-010: Agent Context Sync Failed
    Expected Agent: [from status.json]
    Prompt Path: [path]
    Error: [specific failure reason]
    
    Recovery:
    1. Verify prompt file exists
    2. Run read_file on prompt path
    3. Confirm agent identity
    4. GENESIS: RESUME"
```

### 10.3 Why This Matters
```
Without agent sync:
- Agent may operate without proper instructions
- Hallucination risk increases significantly
- Phase-specific rules may be ignored
- Grounding requirements may be skipped

With mandatory sync:
- Agent always has full context
- Phase-specific behavior enforced
- Hallucination prevention rules loaded
- Consistent, predictable operation
```

### 10.4 Sync Verification
The sync confirmation output serves as proof that:
1. The prompt file was actually read (not assumed)
2. The agent identity was parsed and verified
3. The activation condition was checked
4. The agent is ready to operate correctly

If this confirmation is missing → HALT-010

---

## 11. Collaboration Support

### 11.1 Modes
```yaml
collaboration.mode: "single" | "team"

Single mode (default):
  - One user, one session
  - No assignee tracking

Team mode:
  - Multiple users possible
  - Task assignees tracked
  - Requires explicit handoff
```

### 11.2 Task Assignment (Team Mode)
```yaml
In tasks.md:
  **Assignee:** @username

In status.json:
  collaboration.assignees: {
    "Task 2.1": "@alice",
    "Task 2.2": "@bob"
  }
  collaboration.current_user: "@alice"
```

### 11.3 Handoff Protocol
```yaml
To hand off to another user:
  1. GENESIS: CHECKPOINT PARTIAL (save progress)
  2. Update collaboration.current_user
  3. Next user runs GENESIS: STATUS to see state
  4. Continues from resume_point
```


---

## 12. Configurable Thresholds

All timing and limit thresholds are configurable in `status.json` under the `config` section.

### 12.1 Configuration Reference

| Setting | Default | Description | Impact |
|---------|---------|-------------|--------|
| `max_retries` | 3 | Max retry attempts before HALT-003 | Error tolerance |
| `max_iterations` | 5 | Max iterations per phase | Refinement cycles |
| `checkpoint_expiry_hours` | 72 | Hours before checkpoint expires | Review window |
| `session_stale_hours` | 48 | Hours before session considered stale | Resume warnings |
| `require_human_approval` | true | Require approval at checkpoints | Automation level |
| `strict_mode` | true | Enforce all governance rules | Rule flexibility |
| `allow_partial_checkpoints` | true | Enable incremental saves | Progress safety |
| `require_agent_sync` | true | Mandate agent context loading | Consistency |
| `research_fallback_enabled` | true | Allow non-official sources as fallback | Research flexibility |
| `research_fallback_requires_approval` | true | Require approval for fallback sources | Quality control |
| `validate_prompts_on_init` | true | Validate all agent prompts on GENESIS: INIT | Startup safety |

### 12.2 Adjusting Thresholds

```yaml
# For distributed teams across time zones:
config.checkpoint_expiry_hours: 96  # 4 days
config.session_stale_hours: 72      # 3 days

# For rapid prototyping:
config.max_iterations: 10
config.require_human_approval: false  # WARNING: Reduces oversight

# For strict compliance environments:
config.strict_mode: true
config.research_fallback_enabled: false
config.require_human_approval: true
```

### 12.3 Runtime Configuration Changes

Configuration can be modified at runtime:
```yaml
1. Edit .genesis/status.json directly
2. Changes take effect on next command
3. Some changes require GENESIS: VALIDATE to apply:
   - require_human_approval
   - strict_mode
   - require_agent_sync
```

### 12.4 Configuration Validation

On any configuration change, system validates:
```yaml
- checkpoint_expiry_hours >= 24 (minimum review window)
- session_stale_hours >= 12 (minimum activity window)
- max_retries >= 1 (at least one attempt)
- max_iterations >= 1 (at least one cycle)

Invalid configurations:
  - Log warning
  - Revert to default
  - Continue operation
```

---

## 13. Research Fallback Protocol

When official documentation is unavailable, the system can use fallback sources with appropriate safeguards.

### 13.1 Fallback Conditions
```yaml
Fallback triggers when:
  1. Official documentation URL returns 404/error
  2. Official docs don't cover required feature
  3. Library is too new for comprehensive docs
  4. Version-specific docs unavailable

Fallback requires:
  - config.research_fallback_enabled = true
  - Human approval if config.research_fallback_requires_approval = true
```

### 13.2 Acceptable Fallback Sources (Ranked)
| Priority | Source Type | Trust Level | Requires Approval |
|----------|-------------|-------------|-------------------|
| 1 | Official GitHub README | HIGH | No |
| 2 | Official GitHub /docs | HIGH | No |
| 3 | Package registry (npm/PyPI) | MEDIUM | If detailed |
| 4 | Official blog posts | MEDIUM | Yes |
| 5 | Verified community wikis | LOW | Yes |

### 13.3 Fallback Documentation Requirements
All fallback-sourced documentation MUST:
```yaml
- Include "⚠️ VERIFICATION REQUIRED" header
- State the fallback source URL
- List official sources that were attempted
- Include confidence level (LOW/MEDIUM)
- Have verification checklist
- Be flagged in research log
```

### 13.4 Fallback Approval Flow
```yaml
When fallback source needed:
  1. System logs: "Official docs unavailable for [X]"
  2. System identifies best fallback source
  3. If research_fallback_requires_approval:
     a. Present fallback source to human
     b. Show: Source URL, trust level, content preview
     c. Await: APPROVE / REJECT / PROVIDE_ALTERNATIVE
  4. On APPROVE: Document with verification flag
  5. On REJECT: Skip item, log as blocked
  6. On PROVIDE_ALTERNATIVE: Use provided source
```


---

## 14. Rollback Governance

### 14.1 Rollback Authority
```yaml
Rollback can be initiated by:
  - Human user (always allowed)
  - System (on critical failure with auto_rollback_on_failure = true)
  
Rollback ALWAYS requires:
  - Confirmation of target phase
  - Acknowledgment of data loss
  - Human approval (except auto-rollback on critical failure)
```

### 14.2 Rollback Scope by Phase
| Target Phase | Artifacts Archived | Progress Reset |
|--------------|-------------------|----------------|
| Phase 1 | design.md, tasks.md, docs/*, src/*, validation.md, .deploy/* | All |
| Phase 2 | tasks.md, docs/*, src/*, validation.md, .deploy/* | Phase 2+ |
| Phase 3 | docs/*, src/*, validation.md, .deploy/* | Phase 3+ |
| Phase 4 | src/*, validation.md, .deploy/* | Phase 4+ |
| Phase 5 | validation.md, .deploy/* | Phase 5+ |
| Phase 6 | .deploy/* | Phase 6+ |

### 14.3 Archive Retention
```yaml
Archive location: .genesis/archive/[timestamp]/
Retention policy:
  - Keep last 5 rollback archives
  - Auto-cleanup archives older than 30 days
  - Never delete if rollback_count < 5

Archive structure:
  .genesis/archive/
  └── 2024-01-15T10-30-00/
      ├── manifest.json      # What was archived and why
      ├── .spec/             # Spec files at time of rollback
      ├── docs/              # Research docs (excluding _cache/)
      ├── src/               # Source code
      └── .deploy/           # Deployment artifacts
```

### 14.4 Rollback Restrictions
```yaml
CANNOT rollback when:
  - halted = true (must GENESIS: RESUME first)
  - checkpoint.pending = true (must resolve first)
  - Target phase > current phase (use GENESIS: ADVANCE)
  - Target phase = 0 (use GENESIS: INIT to restart)

SPECIAL HANDLING:
  - Phase 4 rollback: Preserves docs/_cache/ (research cache)
  - Phase 7 rollback: Requires deployment rollback first if deployed
```

### 14.5 Post-Rollback Protocol
```yaml
After successful rollback:
  1. System reports:
     - New current phase
     - Archived artifacts location
     - Active agent for phase
     - Resume point
  
  2. Human must:
     - Review archived artifacts if needed
     - Understand why rollback was necessary
     - Address root cause before re-advancing
  
  3. System tracks:
     - rollback.last_rollback timestamp
     - rollback.rollback_count increment
     - metrics.rollbacks increment
     - Transition logged to transitions[]
```

---

## 15. Research Cache Governance

### 15.1 Cache Purpose
The research cache (`docs/_cache/`) reduces web fetch failures and speeds up the research phase by storing previously fetched official documentation.

### 15.2 Cache Rules
```yaml
Cache entries:
  - MUST be from official sources only
  - MUST include source URL and fetch timestamp
  - MUST have content hash for integrity
  - MUST respect TTL (default: 168 hours / 7 days)

Cache usage:
  - Check cache BEFORE web search
  - Use cached content if valid (not expired)
  - Refresh cache on expiry
  - Allow stale cache as fallback on fetch failure
```

### 15.3 Cache Integrity
```yaml
On cache read:
  1. Verify content_hash matches stored hash
  2. If mismatch: Treat as cache miss, re-fetch
  3. Log integrity failures for investigation

On cache write:
  1. Calculate content_hash
  2. Store with metadata
  3. Update _index.json statistics
```

### 15.4 Cache Invalidation Events
| Event | Action |
|-------|--------|
| TTL expires | Mark expired, re-fetch on next access |
| Version change in design.md | Invalidate affected library entries |
| GENESIS: CACHE CLEAR | Remove all/specified entries |
| Manual deletion | Treat as cache miss |
| Rollback to Phase 4 | Preserve cache (not archived) |

### 15.5 Stale Cache Usage
```yaml
When fetch fails AND stale cache exists:
  1. Log: "Using stale cache for [library]/[feature]"
  2. Set source_confidence = "LOW"
  3. Add warning to generated doc:
     "⚠️ STALE CACHE - Content may be outdated"
  4. Continue with stale content
  5. Flag for re-verification in next research cycle
```

---

## 16. Parallel Execution Governance

### 16.1 Parallel Execution Scope
```yaml
Parallel execution applies to:
  - Phase 5 (Implementation) only
  - Tasks with no shared dependencies
  - Independent code modules

NOT applicable to:
  - Phases 1-4 (inherently sequential)
  - Phase 6 (must test complete system)
  - Phase 7 (atomic deployment)
```

### 16.2 Parallel Execution Rules
```yaml
When config.parallel_execution_enabled = true:

  Task Selection:
  - Identify tasks with all dependencies satisfied
  - Group into batches of max_parallel_tasks
  - Never parallelize tasks touching same files
  
  Execution:
  - Process batch concurrently
  - Track individual task status
  - Wait for batch completion before dependent batch
  
  Conflict Resolution:
  - If merge conflict detected: Halt batch
  - Resolve conflict manually
  - Resume with GENESIS: RESUME
```

### 16.3 Parallel Execution Risks
| Risk | Mitigation |
|------|------------|
| Merge conflicts | File-level dependency tracking |
| Inconsistent state | Atomic batch commits |
| Debugging difficulty | Per-task logging |
| Resource exhaustion | max_parallel_tasks limit |

---

## 17. Soft Gates (Non-Blocking Validations)

### 17.1 Purpose
Soft gates allow non-critical validations to warn without blocking progress. This prevents minor issues from halting the entire pipeline while maintaining visibility.

### 17.2 Gate Classification
| Gate Type | Behavior | Examples |
|-----------|----------|----------|
| HARD | Block on failure | Security vulnerabilities, missing artifacts, test failures |
| SOFT | Warn and continue | Documentation gaps, style violations, low coverage |

### 17.3 Soft Gate Rules
```yaml
soft_gates.rules:
  documentation_completeness:
    severity: soft
    threshold: 80          # Warn if <80% documented
    phase: [5, 6]          # Check in Implementation, Validation
    
  test_coverage_minimum:
    severity: soft
    threshold: 70          # Warn if <70% coverage
    phase: [6]
    
  code_comment_ratio:
    severity: soft
    threshold: 10          # Warn if <10% comment ratio
    phase: [5]
    
  naming_conventions:
    severity: soft
    threshold: 90          # Warn if <90% compliance
    phase: [5]
    
  unused_dependencies:
    severity: soft
    threshold: 0           # Warn if any unused deps
    phase: [5, 6]
```

### 17.4 Soft Gate Policies
```yaml
config.soft_gate_policy options:

"warn_and_continue":     # Default - log warning, proceed
  - Log violation to soft_gates.violations
  - Display warning to user
  - Continue without blocking
  - Include in checkpoint summary

"warn_and_confirm":      # Require acknowledgment
  - Log violation
  - Display warning
  - Require user to acknowledge before continuing
  - Track acknowledgment in violations

"accumulate_and_block":  # Block after threshold
  - Log all violations
  - Continue until violation_count > max_soft_violations
  - Block and require resolution when threshold exceeded
  - Default max_soft_violations: 10
```

### 17.5 Soft Gate Violation Format
```yaml
soft_gates.violations[]:
  - id: "SG-001"
    rule: "documentation_completeness"
    phase: 5
    timestamp: "2024-01-15T10:30:00Z"
    details: "Component AuthService missing JSDoc: 65% documented"
    threshold: 80
    actual: 65
    acknowledged: false
    acknowledged_by: null
```

### 17.6 Converting Soft to Hard Gates
```yaml
To escalate a soft gate to hard:
  1. Edit soft_gates.rules.[rule].severity = "hard"
  2. Rule will block on next validation
  3. Existing violations become blocking

To demote a hard gate to soft:
  1. Edit governance rules (requires careful consideration)
  2. Only for non-security, non-critical validations
  3. Document rationale in transitions[]
```

---

## 18. Tiered Research Sources

### 18.1 Purpose
Replace binary official/unofficial classification with confidence-scored tiers. This allows progress when official docs are unavailable while maintaining quality visibility.

### 18.2 Source Tiers
| Tier | Source Type | Confidence | Auto-Approve | Examples |
|------|-------------|------------|--------------|----------|
| 1 | Official Documentation | 100% | Yes | react.dev, nodejs.org/docs |
| 2 | Official GitHub | 85% | Yes | README.md, /docs folder |
| 3 | Package Registry | 70% | No | npm package page, PyPI |
| 4 | Verified Community | 50% | No | Official Discord, verified wikis |
| 5 | Fallback Sources | 30% | No | Blog posts, tutorials |

### 18.3 Confidence Scoring
```yaml
research_sources.tiers:
  tier_1_official:
    confidence: 100
    auto_approve: true
    domains: ["*.dev", "*.org/docs", "*.io/docs"]
    
  tier_2_github:
    confidence: 85
    auto_approve: true
    paths: ["README.md", "/docs/", "/documentation/"]
    
  tier_3_registry:
    confidence: 70
    auto_approve: false
    domains: ["npmjs.com", "pypi.org", "crates.io"]
    
  tier_4_community:
    confidence: 50
    auto_approve: false
    requires: ["verified_maintainer", "recent_update"]
    
  tier_5_fallback:
    confidence: 30
    auto_approve: false
    warning: "⚠️ LOW CONFIDENCE - Verify before implementation"
```

### 18.4 Minimum Confidence Threshold
```yaml
research_sources.minimum_confidence: 50  # Default

Behavior:
  - Sources below threshold require explicit approval
  - Approval logged with justification
  - Implementation must include verification checklist
  
Adjustable per project:
  - Prototype/MVP: minimum_confidence: 30
  - Production: minimum_confidence: 70
  - Regulated: minimum_confidence: 85
```

### 18.5 Source Usage Logging
```yaml
research_sources.usage_log[]:
  - library: "react"
    feature: "useState"
    tier: 1
    confidence: 100
    source_url: "https://react.dev/reference/react/useState"
    timestamp: "2024-01-15T10:30:00Z"
    approved_by: "auto"
    
  - library: "obscure-lib"
    feature: "config"
    tier: 4
    confidence: 50
    source_url: "https://github.com/user/obscure-lib/wiki"
    timestamp: "2024-01-15T11:00:00Z"
    approved_by: "human"
    justification: "No official docs exist, maintainer-verified wiki"
```

### 18.6 Tiered Research Protocol
```yaml
When researching [library]/[feature]:

1. SEARCH Tier 1 (Official):
   - Query official documentation domains
   - If found: Use directly, confidence=100
   
2. IF NOT FOUND, SEARCH Tier 2 (GitHub):
   - Check official repository README/docs
   - If found: Use with confidence=85
   
3. IF NOT FOUND, SEARCH Tier 3 (Registry):
   - Check package registry documentation
   - If found AND confidence >= minimum: Request approval
   
4. IF NOT FOUND, SEARCH Tier 4 (Community):
   - Check verified community sources
   - If found: Request approval with justification
   
5. IF NOT FOUND, SEARCH Tier 5 (Fallback):
   - Use fallback sources as last resort
   - ALWAYS request approval
   - Mark doc with "⚠️ LOW CONFIDENCE"
   
6. IF NOTHING FOUND:
   - Log: "No sources found for [library]/[feature]"
   - Skip item, continue with others
   - Report gap in checkpoint summary
```

### 18.7 HALT-006 Revision
```yaml
HALT-006 now triggers ONLY when:
  - Source confidence < minimum_confidence AND
  - Human explicitly rejects the source AND
  - No alternative sources available

HALT-006 does NOT trigger when:
  - Low-confidence source is approved by human
  - Source meets minimum_confidence threshold
  - Fallback is enabled and source is logged
```

---

## 19. Prompt Versioning

### 19.1 Purpose
Enable safe updates to agent prompts without breaking active sessions. Provides migration paths and backward compatibility.

### 19.2 Version Schema
```yaml
prompts:
  version: "1.0.0"           # Current prompt set version
  schema_version: "1.0"      # Prompt format version
  
  versions:
    product_owner:
      version: "1.0.0"
      updated: "2024-01-15T10:00:00Z"
      checksum: "sha256:abc123..."
      
    architect:
      version: "1.0.0"
      updated: "2024-01-15T10:00:00Z"
      checksum: "sha256:def456..."
      
    # ... other agents
    
  compatibility:
    min_version: "1.0.0"     # Minimum compatible version
    migration_available: false
```

### 19.3 Version Numbering
```yaml
MAJOR.MINOR.PATCH

MAJOR: Breaking changes
  - Removed required sections
  - Changed activation conditions
  - Incompatible workflow changes
  
MINOR: New features (backward compatible)
  - Added optional sections
  - Enhanced instructions
  - New capabilities
  
PATCH: Bug fixes
  - Typo corrections
  - Clarifications
  - Minor improvements
```

### 19.4 Prompt Update Protocol
```yaml
When updating a prompt:

1. INCREMENT version appropriately
2. UPDATE checksum with new file hash
3. SET updated timestamp
4. IF MAJOR version change:
   a. Create migration guide
   b. Set migration_available = true
   c. Update min_version if needed
5. VALIDATE prompt structure
6. TEST with sample workflow
7. COMMIT changes
```

### 19.5 Compatibility Check
```yaml
On agent sync (HALT-010 prevention):

1. READ prompt file
2. CALCULATE current checksum
3. COMPARE with stored checksum:
   
   IF match:
     - Use cached identity (fast path)
     - Skip full re-parse
     
   IF mismatch:
     - Parse prompt fully
     - Extract version from prompt header
     - CHECK version >= min_version
     - IF compatible: Update checksum, continue
     - IF incompatible: Warn user, offer migration
```

### 19.6 Migration Protocol
```yaml
When migration_available = true:

1. DETECT version mismatch on session start
2. DISPLAY migration notice:
   "Prompt version updated: [old] → [new]
    Changes: [summary]
    Migration required: [yes/no]"
    
3. IF migration required:
   a. Backup current state
   b. Apply migration steps
   c. Validate migrated state
   d. Update version references
   
4. IF migration optional:
   a. Offer to continue with old behavior
   b. Or apply migration for new features
```

### 19.7 Prompt Header Format
```markdown
# [Agent Name] Agent - Phase [N]: [Phase Name]

<!-- PROMPT_VERSION: 1.0.0 -->
<!-- SCHEMA_VERSION: 1.0 -->
<!-- UPDATED: 2024-01-15 -->
<!-- CHECKSUM: sha256:abc123... -->

## Agent Identity
...
```

---

## 20. Rollback Verification

### 20.1 Purpose
Ensure rollback operations are safe and reversible by verifying archive integrity and offering dry-run capability.

### 20.2 Archive Verification
```yaml
On archive creation:

1. CREATE archive at .genesis/archive/[timestamp]/
2. COPY artifacts to archive
3. CALCULATE checksums for each file
4. WRITE manifest.json with:
   - File list with checksums
   - Source phase
   - Target phase
   - Timestamp
   - Reason
5. VERIFY archive integrity:
   - Re-read each file
   - Compare checksums
   - Log verification result
6. UPDATE rollback.verification:
   - last_verified: now()
   - status: "verified" | "failed"
   - archive_integrity.[timestamp]: true | false
```

### 20.3 Manifest Format
```json
{
  "archive_id": "2024-01-15T10-30-00",
  "created_at": "2024-01-15T10:30:00Z",
  "source_phase": 5,
  "target_phase": 3,
  "reason": "Design revision required",
  "files": [
    {
      "path": ".spec/tasks.md",
      "checksum": "sha256:abc123...",
      "size_bytes": 15420,
      "verified": true
    },
    {
      "path": "docs/react/useState.md",
      "checksum": "sha256:def456...",
      "size_bytes": 3200,
      "verified": true
    }
  ],
  "verification": {
    "status": "passed",
    "verified_at": "2024-01-15T10:30:05Z",
    "file_count": 12,
    "total_size_bytes": 45600
  }
}
```

### 20.4 Dry-Run Rollback
```yaml
GENESIS: ROLLBACK <phase> --dry-run

Behavior:
1. SIMULATE rollback without making changes
2. REPORT what would happen:
   
   "DRY-RUN: Rollback from Phase 5 to Phase 3
   
    Files to archive (12 files, 45.6 KB):
    - .spec/tasks.md
    - docs/react/useState.md
    - docs/express/middleware.md
    - src/services/auth.ts
    - src/api/routes.ts
    ...
    
    Progress to reset:
    - Phase 4: 8 docs completed → 0
    - Phase 5: 5 tasks completed → 0
    
    State changes:
    - phase.current: 5 → 3
    - gates.gate_4: PASSED → LOCKED
    - gates.gate_5: IN_PROGRESS → LOCKED
    
    Archive location: .genesis/archive/2024-01-15T10-30-00/
    
    No changes made. Run without --dry-run to execute."

3. DO NOT modify any files or state
4. RETURN to current state
```

### 20.5 Rollback Integrity Check
```yaml
Before executing rollback:

1. VERIFY target phase is valid
2. CHECK archive directory is writable
3. ESTIMATE archive size
4. VERIFY sufficient disk space
5. CHECK no pending checkpoints
6. VERIFY system not halted
7. IF any check fails:
   - Report specific failure
   - Suggest resolution
   - DO NOT proceed
```

### 20.6 Post-Rollback Verification
```yaml
After rollback completes:

1. VERIFY archived files exist and match checksums
2. VERIFY state reflects target phase
3. VERIFY appropriate agent is active
4. RUN integrity check on remaining artifacts
5. REPORT verification results:
   
   "Rollback Verification:
    ✅ Archive created: .genesis/archive/2024-01-15T10-30-00/
    ✅ 12 files archived (checksums verified)
    ✅ State updated to Phase 3
    ✅ Tech Lead agent activated
    ✅ Remaining artifacts intact
    
    Rollback successful."
```

### 20.7 HALT-013: Rollback Verification Failed
```yaml
New halt code for rollback integrity failures:

HALT-013: Rollback Verification Failed

Triggers:
  - Archive checksum mismatch
  - Archive write failed
  - State inconsistency after rollback
  - Artifact corruption detected

Recovery:
  1. Review verification error details
  2. Check disk space and permissions
  3. Attempt manual archive verification
  4. If archive corrupted: May need to restart from checkpoint
  5. GENESIS: RESUME with confirmation
```

---

## 21. Observability Dashboard

### 21.1 Purpose
Provide visibility into framework performance, bottlenecks, and failure patterns to enable continuous improvement.

### 21.2 Metrics Collection
```yaml
metrics.phase_timing:
  phase_1:
    started: "2024-01-15T09:00:00Z"
    completed: "2024-01-15T10:30:00Z"
    duration_hours: 1.5
    iterations: 2
    
  phase_2:
    started: "2024-01-15T10:35:00Z"
    completed: "2024-01-15T14:00:00Z"
    duration_hours: 3.4
    iterations: 1

metrics.agent_performance:
  product_owner:
    tasks_completed: 1
    avg_iteration_count: 2.0
    rejection_rate: 0.0
    avg_time_to_checkpoint_hours: 1.5
    
  researcher:
    tasks_completed: 15
    avg_iteration_count: 0.5
    rejection_rate: 0.1
    cache_hit_rate: 0.65
    avg_fetch_time_seconds: 2.3
```

### 21.3 Failure Pattern Tracking
```yaml
metrics.failure_patterns[]:
  - pattern_id: "FP-001"
    description: "Research fetch timeout"
    occurrences: 5
    phases: [4]
    agents: ["researcher"]
    first_seen: "2024-01-10T10:00:00Z"
    last_seen: "2024-01-15T14:00:00Z"
    resolution: "Increased timeout, added retry"
    status: "resolved"
    
  - pattern_id: "FP-002"
    description: "Validation timeout on large test suites"
    occurrences: 3
    phases: [6]
    agents: ["validator"]
    first_seen: "2024-01-12T16:00:00Z"
    last_seen: "2024-01-15T09:00:00Z"
    resolution: null
    status: "active"
```

### 21.4 Bottleneck Detection
```yaml
metrics.bottlenecks[]:
  - phase: 4
    agent: "researcher"
    metric: "avg_time_per_doc"
    value: 45.2
    threshold: 30.0
    severity: "warning"
    suggestion: "Consider enabling research cache"
    
  - phase: 2
    agent: "architect"
    metric: "checkpoint_wait_hours"
    value: 72.5
    threshold: 48.0
    severity: "critical"
    suggestion: "Human approval delayed - consider async review"
```

### 21.5 GENESIS: METRICS Command
```yaml
GENESIS: METRICS

Output:
"═══════════════════════════════════════════════════════════
                    GENESIS METRICS DASHBOARD
═══════════════════════════════════════════════════════════

PROJECT: My SaaS App
DURATION: 5 days, 3 hours (started 2024-01-10)

PHASE TIMING
┌─────────┬──────────┬────────────┬────────────┐
│ Phase   │ Duration │ Iterations │ Status     │
├─────────┼──────────┼────────────┼────────────┤
│ 1-Req   │ 1.5h     │ 2          │ ✅ Complete │
│ 2-Design│ 3.4h     │ 1          │ ✅ Complete │
│ 3-Tasks │ 2.1h     │ 3          │ ✅ Complete │
│ 4-Research│ 8.2h   │ 0          │ ✅ Complete │
│ 5-Impl  │ 24.5h    │ 5          │ 🟡 Active  │
│ 6-Valid │ -        │ -          │ ⚪ Pending │
│ 7-Deploy│ -        │ -          │ ⚪ Pending │
└─────────┴──────────┴────────────┴────────────┘

AGENT PERFORMANCE
┌───────────────┬───────┬────────────┬──────────┐
│ Agent         │ Tasks │ Rejections │ Avg Time │
├───────────────┼───────┼────────────┼──────────┤
│ Product Owner │ 1     │ 0%         │ 1.5h     │
│ Architect     │ 1     │ 0%         │ 3.4h     │
│ Tech Lead     │ 1     │ 10%        │ 2.1h     │
│ Researcher    │ 15    │ 5%         │ 0.5h/doc │
│ Developer     │ 8/12  │ 8%         │ 3.1h/task│
└───────────────┴───────┴────────────┴──────────┘

RESEARCH CACHE
  Hit Rate: 65%
  Entries: 15 (12 valid, 3 expired)
  Saved Fetches: ~10

ACTIVE BOTTLENECKS
  ⚠️ Phase 5: High iteration count (5) - consider design review
  
FAILURE PATTERNS
  🔴 FP-002: Validation timeout (3 occurrences) - unresolved

SOFT GATE VIOLATIONS
  ⚠️ 2 warnings (documentation_completeness: 75%)
═══════════════════════════════════════════════════════════"
```

### 21.6 Metrics Export
```yaml
GENESIS: METRICS EXPORT [format]

Formats:
  - json: Full metrics as JSON file
  - csv: Tabular data for spreadsheet analysis
  - md: Markdown report for documentation

Output location: .genesis/reports/metrics-[timestamp].[format]
```

### 21.7 Automated Insights
```yaml
On checkpoint or phase completion:

1. ANALYZE metrics for anomalies:
   - Phase duration > 2x average
   - Iteration count > max_iterations - 1
   - Rejection rate > 20%
   - Cache hit rate < 50%
   
2. GENERATE insights:
   "📊 Phase 5 Insights:
    - Duration 24.5h (above average 18h)
    - 5 iterations used (max: 5) - consider REJECT for major changes
    - Task 3.2 took 8h (others avg 2h) - potential complexity issue"
    
3. SUGGEST improvements:
   "💡 Suggestions:
    - Enable parallel execution for independent tasks
    - Review Task 3.2 for scope reduction
    - Consider partial checkpoints every 3 tasks"
```
