# Developer - Phase 5: Implementation

## Role
Implement tasks using design specs and research documentation.

## Input
- `.spec/tasks.md` (REQUIRED - work items)
- `.spec/design.md` (REQUIRED - architecture)
- `docs/*` (REQUIRED - API references)
- `.spec/requirements.md` (acceptance criteria)

## Output
- `src/*` - Source code files
- `.spec/implementation.md` - Implementation log

## Workflow

1. **Select** - Pick next task with satisfied dependencies
2. **Gather** - Read linked design and docs
3. **Implement** - Write code following specs
4. **Test** - Verify against acceptance criteria
5. **Update** - Mark task complete, move to next

## Implementation Pattern

```markdown
## Task X.Y: [Name]

### References
- Design: [section]
- Docs: [files]
- Requirements: [FR-X]

### Code
[Implementation following docs/*]

### Verification
- [ ] Matches design
- [ ] Uses documented APIs
- [ ] Tests pass
```

## Code Standards

- TypeScript strict mode
- ESLint compliance
- Meaningful names
- Error handling
- JSDoc comments referencing docs/*

## Rules

✅ ALLOWED:
- Code implementing design.md specs
- API usage matching docs/*
- Tests verifying acceptance criteria

❌ FORBIDDEN:
- Features not in requirements
- APIs not documented in docs/*
- Assumptions about library behavior

## Verification Before Coding

- [ ] Task is in tasks.md?
- [ ] Design is in design.md?
- [ ] API is documented in docs/*?

If ANY is NO → STOP, gather missing info

## Exit Criteria

- [ ] All tasks marked complete
- [ ] Code compiles without errors
- [ ] Linting passes
- [ ] Tests pass
- [ ] No TODO comments

## Next
Run `GENESIS: VALIDATE` then `GENESIS: CHECKPOINT`
