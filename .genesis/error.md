# Genesis Framework - Error Log

## Error Management

This document tracks all errors, their fingerprints, and resolution status. The system uses fingerprinting to prevent infinite loops by halting after 3 occurrences of the same error.

---

## Active Errors

*No active errors*

---

## Error Format

```yaml
- id: ERR-XXXX
  timestamp: YYYY-MM-DD HH:MM:SS
  phase: [0-7]
  agent: [agent_name]
  severity: CRITICAL | ERROR | WARNING | INFO
  category: VALIDATION | RESEARCH | EXECUTION | STATE | SECURITY
  code: [HALT-XXX if applicable]
  message: "Description of what went wrong"
  context: "What was being attempted when error occurred"
  fingerprint: "hash(category + phase + message_type)"
  retry_count: 0
  max_retries: 3
  resolution: null | "How it was resolved"
  status: OPEN | RESOLVED | BLOCKED
```

---

## Severity Levels

| Severity | Description | Auto-Halt | Action |
|----------|-------------|-----------|--------|
| CRITICAL | System cannot continue | Yes | Immediate halt |
| ERROR | Operation failed | After 3 retries | Log, attempt recovery |
| WARNING | Potential issue | No | Log, continue |
| INFO | Informational | No | Log only |

---

## Error Categories

| Category | Examples | Typical Severity |
|----------|----------|------------------|
| VALIDATION | Missing field, invalid format, gate failure | ERROR |
| RESEARCH | Non-official source, missing docs | CRITICAL |
| EXECUTION | Task failed, build error, test failure | ERROR |
| STATE | Invalid transition, locked gate | CRITICAL |
| SECURITY | Vulnerability found, secret exposed | CRITICAL |

---

## Fingerprint Registry

Tracks unique errors to prevent infinite retry loops.

| Fingerprint | Category | Phase | First Seen | Count | Last Message | Blocked |
|-------------|----------|-------|------------|-------|--------------|---------|
| | | | | | | |

### Fingerprint Calculation
```
fingerprint = hash(category + phase + normalize(message))
```

### Blocking Rules
- Count >= 3 → Error blocked → HALT-003 triggered
- Blocked errors require manual `GENESIS: RESUME` with justification
- On unblock: Reset count to 0

---

## Error History

*No resolved errors*

### History Entry Format
```yaml
- id: ERR-XXXX
  resolved_at: YYYY-MM-DD HH:MM:SS
  resolution: "Description of fix"
  resolved_by: [human | agent]
  prevented_recurrence: [yes | no]
```

---

## Halt Log

Records all system halts and their resolution.

| Timestamp | Code | Reason | Phase | Agent | Resolved | Resolution |
|-----------|------|--------|-------|-------|----------|------------|
| | | | | | | |

---

## Recovery Procedures

### HALT-001: Gate Validation Failed
1. Review validation errors in checkpoint output
2. Fix identified issues in current phase artifact
3. Run `GENESIS: VALIDATE` again
4. If passes, run `GENESIS: RESUME`

### HALT-002: Phase Skip Attempted
1. System automatically returns to correct phase
2. Complete current phase before advancing
3. Run `GENESIS: RESUME`

### HALT-003: Error Repeated 3+ Times
1. Review error fingerprint details
2. Identify root cause (not just symptoms)
3. Implement fix that prevents recurrence
4. Run `GENESIS: RESUME` with justification
5. System resets error count

### HALT-004: Required Artifact Missing
1. Identify missing artifact from error message
2. Create artifact using appropriate agent
3. Run `GENESIS: RESUME`

### HALT-005: Circular Dependency
1. Review dependency graph in tasks.md
2. Identify circular reference
3. Restructure tasks to break cycle
4. Run `GENESIS: RESUME`

### HALT-006: Non-Official Source
1. Identify contaminated documentation
2. Delete or quarantine affected content
3. Re-research from official sources only
4. Run `GENESIS: RESUME` with confirmation

### HALT-007: Human Approval Rejected
1. Review rejection feedback
2. Address concerns in current phase
3. Re-submit for checkpoint
4. System auto-resumes on approval

### HALT-008: Test Failure (Critical)
1. Review failing tests
2. Fix code issues
3. Re-run tests
4. Run `GENESIS: RESUME` when tests pass

### HALT-009: Security Vulnerability
1. Review vulnerability details
2. Implement remediation
3. Re-run security scan
4. Run `GENESIS: RESUME` when clean

### HALT-010: Agent Context Sync Failed
1. Identify which agent should be active for current phase
2. Verify the prompt file exists at the path in status.json
3. Execute `read_file` on the agent prompt path
4. Verify the prompt contains:
   - `## Agent Identity` section
   - `## Activation Condition` matching current phase
5. Update agents.sync in status.json:
   - status: "SYNCED"
   - last_synced: [timestamp]
   - prompt_loaded: [path]
   - identity_verified: true
6. Run `GENESIS: RESUME`

**Common causes:**
- Agent prompt file missing or moved
- Wrong agent active for current phase
- Prompt file corrupted or incomplete
- read_file operation skipped
- Prompt hash mismatch (if validate_prompt_hash_on_sync enabled)

### HALT-011: Rollback Failed
1. Review rollback error details
2. Check archive directory permissions
3. Verify target phase is valid (1-6)
4. Ensure no pending checkpoints
5. Resolve any blocking conditions
6. Run `GENESIS: RESUME` and retry rollback

**Common causes:**
- Target phase invalid
- Checkpoint pending (must resolve first)
- System halted (must resume first)
- Archive directory not writable
- Artifacts already archived

### HALT-012: Cache Integrity Failure
1. Review cache integrity error
2. Check docs/_cache/_index.json
3. Clear corrupted cache entries: `GENESIS: CACHE CLEAR [library]`
4. Re-run research for affected items
5. Run `GENESIS: RESUME`

**Common causes:**
- Cache file corrupted
- Content hash mismatch
- _index.json out of sync
- Manual cache file modification

### HALT-013: Rollback Verification Failed
1. Review verification error details
2. Check archive directory permissions and disk space
3. Verify archive checksums manually if needed
4. If archive corrupted, may need to restart from last checkpoint
5. Run `GENESIS: RESUME` with confirmation

**Common causes:**
- Archive write failed mid-operation
- Disk space exhausted during archive
- File permissions changed
- Checksum mismatch after archive creation
- State inconsistency after rollback

---

## Metrics

| Metric | Value |
|--------|-------|
| Total Errors | 0 |
| Active Errors | 0 |
| Resolved Errors | 0 |
| Blocked Errors | 0 |
| Total Halts | 0 |
| Halts Resolved | 0 |
| Cache Hits | 0 |
| Cache Misses | 0 |
| Rollbacks | 0 |
