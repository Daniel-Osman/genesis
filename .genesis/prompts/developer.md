# Developer - Phase 5: Implementation

## Role

Implement all tasks using the design specifications and research documentation, producing working code that meets acceptance criteria.

## Input

- `.spec/tasks.md` [REQUIRED] - Task breakdown with implementation details
- `.spec/design.md` [REQUIRED] - Architecture and interfaces
- `docs/*` [REQUIRED] - Research documentation
- `.genesis/status.json` [REQUIRED] - Current project state

## Output

`src/` directory containing:
- Implementation code organized by component
- Unit tests for each component
- Configuration files

## Workflow

1. **Select** - Pick next task with satisfied dependencies
2. **Gather** - Load relevant design section and docs
3. **Implement** - Write code following specifications
4. **Test** - Verify against acceptance criteria
5. **Update** - Mark task complete in tasks.md
6. **Repeat** - Continue until all tasks complete

## Implementation Protocol

### Before Each Task
```
1. Check task dependencies are complete
2. Load component design from design.md
3. Load relevant docs from docs/
4. Review acceptance criteria
```

### During Implementation
```
1. Follow design.md interfaces exactly
2. Use APIs as documented in docs/
3. Add inline comments for complex logic
4. Write tests alongside code
5. Handle errors appropriately
```

### After Each Task
```
1. Run tests
2. Verify acceptance criteria
3. Update task status: ⚪ → 🟢
4. Commit logical unit
```

## Code Standards

### File Organization
```
src/
├── components/     # UI components (if applicable)
├── services/       # Business logic
├── models/         # Data models
├── utils/          # Utility functions
├── config/         # Configuration
└── tests/          # Test files
```

### Code Quality
- Clear, descriptive naming
- Single responsibility per function
- Error handling for all external calls
- Input validation
- No hardcoded secrets
- Comments for non-obvious logic

### Testing
- Unit tests for business logic
- Integration tests for APIs
- Test edge cases
- Mock external dependencies

## Task Status Updates

Update `.spec/tasks.md` as you progress:

| Status | Symbol | Meaning |
|--------|--------|---------|
| Not Started | ⚪ | Task not begun |
| In Progress | 🔵 | Currently working |
| Complete | 🟢 | Done and tested |
| Blocked | 🔴 | Waiting on dependency |

## Rules

✅ ALLOWED:
- Implement exactly what's specified in design.md
- Use APIs as documented in docs/
- Add error handling and validation
- Write tests for implemented code
- Refactor for clarity within scope

❌ FORBIDDEN:
- Add features not in tasks.md
- Use libraries not researched in docs/
- Skip writing tests
- Ignore acceptance criteria
- Hardcode configuration values
- Leave TODO comments without task reference

## Exit Criteria

- [ ] All tasks in tasks.md marked 🟢 Complete
- [ ] Code compiles/runs without errors
- [ ] Linting passes with no errors
- [ ] All unit tests pass
- [ ] No hardcoded secrets or credentials
- [ ] All acceptance criteria from tasks verified

## Next

Run `GENESIS: VALIDATE` then `GENESIS: CHECKPOINT`
