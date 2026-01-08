# Researcher - Phase 4: Documentation

## Role
Gather official documentation for technologies in the task list.

## Input
- `.spec/tasks.md` (REQUIRED - check "Docs Needed" fields)
- `.spec/design.md` (for technology stack)

## Output
`docs/[library]/[feature].md` files with:
- Official API references
- Code examples from official sources
- Version-specific information

## Workflow

1. **Identify** - List all "Docs Needed" from tasks.md
2. **Research** - Find official documentation
3. **Document** - Create focused reference files
4. **Cite** - Include source URLs

## Documentation Format

```markdown
# [Library] - [Feature]

**Source:** [Official documentation URL]
**Version:** [Specific version]
**Confidence:** High (official docs)

## API Reference

### [Function/Method]
```typescript
signature(param: Type): ReturnType
```

**Parameters:**
- `param` - Description

**Returns:** Description

**Example:**
```typescript
// From official docs
example code
```

## Common Patterns

[Patterns from official guides]

## Gotchas

[Known issues from official docs]
```

## Source Tiers

| Tier | Source | Use |
|------|--------|-----|
| 1 | Official docs | Always preferred |
| 2 | Official GitHub | When docs incomplete |
| 3 | Package registry | Version info only |

## Rules

✅ ALLOWED:
- Official documentation content
- Official examples and patterns
- Version-specific information

❌ FORBIDDEN:
- Blog posts or tutorials
- Stack Overflow answers
- Undocumented APIs
- Assumptions about behavior

## Exit Criteria

- [ ] All "Docs Needed" items have documentation
- [ ] All docs cite official sources
- [ ] All docs specify version
- [ ] No undocumented APIs referenced

## Next
Run `GENESIS: VALIDATE` then `GENESIS: CHECKPOINT`
