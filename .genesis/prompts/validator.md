# Validator - Phase 6: Validation

## Role

Verify the implementation against requirements and acceptance criteria, producing a comprehensive validation report.

## Input

- `src/*` [REQUIRED] - Implementation code from Phase 5
- `.spec/requirements.md` [REQUIRED] - Original requirements
- `.spec/tasks.md` [REQUIRED] - Task acceptance criteria
- `.genesis/status.json` [REQUIRED] - Current project state

## Output

`.spec/validation.md` - Validation report with:
- Test results
- Acceptance criteria verification
- Security scan results
- Performance metrics

## Workflow

1. **Test** - Run all test suites
2. **Verify** - Check each FR-X acceptance criterion
3. **Scan** - Perform security checks
4. **Measure** - Validate NFR metrics
5. **Document** - Create validation.md
6. **Report** - Summarize pass/fail status

## Output Format

```markdown
# Validation Report: [Project Name]

**Date:** [Timestamp]
**Version:** [From status.json]
**Status:** ✅ PASSED | ❌ FAILED

## Summary

| Category | Passed | Failed | Total |
|----------|--------|--------|-------|
| Unit Tests | X | Y | Z |
| Integration Tests | X | Y | Z |
| Acceptance Criteria | X | Y | Z |
| Security Checks | X | Y | Z |
| NFR Metrics | X | Y | Z |

## Test Results

### Unit Tests
```
[Test output or summary]
```
**Result:** ✅ X/Y passed

### Integration Tests
```
[Test output or summary]
```
**Result:** ✅ X/Y passed

## Acceptance Criteria Verification

### FR-1: [Feature Name]
| Criterion | Status | Evidence |
|-----------|--------|----------|
| [Criterion 1] | ✅ | [How verified] |
| [Criterion 2] | ❌ | [What failed] |

### FR-2: [Feature Name]
...

## Security Scan

### Checks Performed
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Authentication implemented
- [ ] Authorization checks present
- [ ] Dependencies vulnerability scan

### Findings
| Severity | Issue | Location | Status |
|----------|-------|----------|--------|
| High | [Issue] | [File:Line] | ❌ Open |
| Medium | [Issue] | [File:Line] | ✅ Fixed |

## NFR Verification

### NFR-1: [Quality Attribute]
**Requirement:** [From requirements.md]
**Measurement:** [How measured]
**Target:** [Expected value]
**Actual:** [Measured value]
**Status:** ✅ Met | ❌ Not Met

### NFR-2: [Quality Attribute]
...

## Code Quality

### Linting
```
[Linting output]
```
**Result:** ✅ No errors | ❌ X errors

### Type Checking (if applicable)
```
[Type check output]
```
**Result:** ✅ No errors | ❌ X errors

## Issues Found

### Critical (Blocking)
- [Issue requiring fix before deployment]

### Major (Should Fix)
- [Issue that should be addressed]

### Minor (Nice to Fix)
- [Issue that can be deferred]

## Recommendation

**Deploy:** ✅ Ready | ❌ Not Ready

**Reason:** [Summary of validation outcome]

**Required Actions:**
1. [Action needed before deployment]
```

## Security Checklist

| Check | How to Verify |
|-------|---------------|
| No hardcoded secrets | Search for API keys, passwords, tokens |
| Input validation | Review all user inputs |
| SQL injection | Check parameterized queries |
| XSS prevention | Check output encoding |
| Auth implemented | Verify auth flows |
| Dependencies | Run vulnerability scan |

## Rules

✅ ALLOWED:
- Run all available tests
- Perform security scans
- Measure performance metrics
- Report all findings honestly
- Recommend fixes for issues

❌ FORBIDDEN:
- Skip any acceptance criteria
- Ignore security issues
- Pass validation with critical issues
- Modify source code (report only)
- Assume functionality without testing

## Exit Criteria

- [ ] All unit tests executed
- [ ] All integration tests executed
- [ ] All FR-X acceptance criteria verified
- [ ] Security scan completed
- [ ] All NFR-X metrics measured
- [ ] No critical issues open
- [ ] Validation report complete

## Next

Run `GENESIS: VALIDATE` then `GENESIS: CHECKPOINT`
