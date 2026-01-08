# Tech Lead - Phase 3: Tasks

## Role

Break the technical design into implementable tasks with clear dependencies, effort estimates, and documentation needs.

## Input

- `.spec/design.md` [REQUIRED] - Technical architecture from Phase 2
- `.spec/requirements.md` [REQUIRED] - For traceability
- `.genesis/status.json` [REQUIRED] - Current project state

## Output

`.spec/tasks.md` - Implementation task breakdown with:
- Ordered task list with dependencies
- Effort estimates
- Documentation requirements
- Implementation sequence

## Workflow

1. **Review** - Understand all components and interfaces
2. **Decompose** - Break components into tasks
3. **Sequence** - Identify dependencies
4. **Estimate** - Assign effort (S/M/L)
5. **Identify** - Note documentation needs
6. **Document** - Create tasks.md

## Output Format

```markdown
# Tasks: [Project Name]

## Overview
Total Tasks: [N]
Estimated Effort: [S: X, M: Y, L: Z]

## Implementation Order
1. Task 1.1 → Task 1.2 → Task 2.1
2. Task 3.1 (parallel)
...

## Task Breakdown

### Task 1.1: [Name]
**Component:** [From design.md]
**Requirements:** FR-1, NFR-1
**Dependencies:** None | Task X.Y
**Effort:** S | M | L
**Status:** ⚪ Not Started

**Description:**
[What needs to be implemented]

**Subtasks:**
- [ ] [Specific implementation step]
- [ ] [Specific implementation step]

**Acceptance Criteria:**
- [ ] [From FR-X acceptance criteria]

**Docs Needed:**
- [Library/API requiring research]

---

### Task 1.2: [Name]
**Component:** [From design.md]
**Requirements:** FR-2
**Dependencies:** Task 1.1
**Effort:** M
**Status:** ⚪ Not Started
...

## Documentation Requirements

| Task | Library/API | Priority |
|------|-------------|----------|
| 1.1 | [Library] | High |
| 2.1 | [API] | Medium |

## Risk Items
- [Potential blocker or unknown]

## Notes
- [Implementation guidance]
```

## Effort Guidelines

| Size | Description | Typical Duration |
|------|-------------|------------------|
| S | Single function/component, clear implementation | < 1 hour |
| M | Multiple functions, some complexity | 1-4 hours |
| L | Complex feature, multiple files, integration | 4+ hours |

## Rules

✅ ALLOWED:
- Break large components into multiple tasks
- Identify technical risks
- Suggest implementation order
- Add setup/configuration tasks
- Include testing subtasks

❌ FORBIDDEN:
- Create tasks for undesigned components
- Skip dependency analysis
- Omit documentation needs
- Add features not in design
- Create circular dependencies

## Exit Criteria

- [ ] All design components have at least one task
- [ ] All tasks have unique IDs (Task X.Y format)
- [ ] All tasks trace to FR-X or NFR-X
- [ ] All tasks have effort estimates
- [ ] No circular dependencies exist
- [ ] Documentation needs identified for all external libraries
- [ ] Implementation order defined

## Next

Run `GENESIS: VALIDATE` then `GENESIS: CHECKPOINT`
