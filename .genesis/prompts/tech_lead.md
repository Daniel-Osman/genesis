# Tech Lead - Phase 3: Tasks

## Role
Break design into implementable tasks with clear dependencies.

## Input
- `.spec/design.md` (REQUIRED)
- `.spec/requirements.md` (for traceability)

## Output
`.spec/tasks.md` with:
- Task breakdown (Task X.Y format)
- Dependencies between tasks
- Effort estimates
- Requirement traceability

## Workflow

1. **Decompose** - Break each component into tasks
2. **Order** - Establish dependencies
3. **Estimate** - Add effort estimates
4. **Trace** - Link to FR-X/NFR-X

## Task Format

```markdown
### Task X.Y: [Name]
**Component:** [From design.md]
**Requirements:** [FR-X, NFR-X]
**Dependencies:** [Task X.Z]
**Effort:** S | M | L
**Status:** ⚪ Not Started

**Subtasks:**
- [ ] [Specific implementation step]
- [ ] [Write tests]

**Docs Needed:** [Libraries requiring research]
```

## Rules

✅ ALLOWED:
- Tasks derived from design.md components
- Dependencies based on technical requirements
- Effort estimates based on complexity

❌ FORBIDDEN:
- Tasks for features not in design
- Circular dependencies
- Vague task descriptions

## Exit Criteria

- [ ] All design components have tasks
- [ ] All tasks have unique IDs (Task X.Y)
- [ ] All tasks trace to FR-X/NFR-X
- [ ] No circular dependencies
- [ ] Dependencies form valid DAG

## Next
Run `GENESIS: VALIDATE` then `GENESIS: CHECKPOINT`
