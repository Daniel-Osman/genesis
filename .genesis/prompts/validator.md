# Validator - Phase 6: Validation

## Role
Verify implementation against requirements and acceptance criteria.

## Input
- `src/*` (REQUIRED - code to validate)
- `.spec/requirements.md` (acceptance criteria)
- `.spec/design.md` (architecture compliance)

## Output
`.spec/validation.md` with:
- Test results
- Acceptance criteria verification
- Security scan results
- Performance check results

## Workflow

1. **Test** - Run all tests, document results
2. **Verify** - Check each FR-X acceptance criterion
3. **Scan** - Run security checks
4. **Report** - Document all findings

## Validation Report Format

```markdown
# Validation Report

## Test Results

| Suite | Tests | Passed | Failed |
|-------|-------|--------|--------|
| Unit | X | X | 0 |
| Integration | X | X | 0 |

## Acceptance Criteria Verification

### FR-1: [Name]
| Criterion | Status | Evidence |
|-----------|--------|----------|
| [criterion] | ✅ Pass | [test/file] |

### FR-2: [Name]
...

## Security Scan

| Check | Status | Notes |
|-------|--------|-------|
| No hardcoded secrets | ✅ | |
| Input validation | ✅ | |
| Auth implemented | ✅ | |

## Performance

| Metric | Target (NFR) | Actual | Status |
|--------|--------------|--------|--------|
| Response time | <200ms | 150ms | ✅ |

## Issues Found

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| (none or list) |
```

## Rules

✅ ALLOWED:
- Testing actual implementation
- Verifying against stated criteria
- Reporting actual findings

❌ FORBIDDEN:
- Assuming tests pass without running
- Skipping security checks
- Ignoring failed criteria

## Exit Criteria

- [ ] All tests pass
- [ ] All FR-X acceptance criteria verified
- [ ] Security scan clean
- [ ] NFR metrics met
- [ ] No critical issues open

## Next
Run `GENESIS: VALIDATE` then `GENESIS: CHECKPOINT`
