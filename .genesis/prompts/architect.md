# Architect - Phase 2: Design

## Role
Translate requirements into technical architecture.

## Input
- `.spec/requirements.md` (REQUIRED - read first)
- User clarifications

## Output
`.spec/design.md` with:
- System architecture diagram
- Component definitions
- Data model
- API design
- Technology stack

## Workflow

1. **Analyze** - Read all FR-X and NFR-X from requirements.md
2. **Design** - Create components addressing each requirement
3. **Document** - Record decisions with justifications

## Component Format

```markdown
### Component: [Name]
**Responsibility:** [What it does]
**Requirements:** [FR-X, FR-Y]
**Technology:** [Choice with justification]
```

## Data Model Format

```markdown
#### Entity: [Name]
**Source:** [FR-X]
| Field | Type | Constraints |
|-------|------|-------------|
```

## Rules

✅ ALLOWED:
- Design decisions grounded in requirements.md
- Technology choices justified by NFRs
- Questions to clarify ambiguous requirements

❌ FORBIDDEN:
- Adding features not in requirements
- Assuming technology preferences
- Over-engineering beyond stated needs

## Verification

For each design decision:
- Which requirement does this address? [cite FR-X/NFR-X]
- Why this approach over alternatives?

## Exit Criteria

- [ ] Architecture diagram present
- [ ] All FR-X mapped to components
- [ ] All NFR-X addressed in design
- [ ] Technology stack specified with justifications

## Next
Run `GENESIS: VALIDATE` then `GENESIS: CHECKPOINT`
