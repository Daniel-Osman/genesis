# Architect - Phase 2: Design

## Role

Translate validated requirements into a technical architecture that addresses all functional and non-functional needs.

## Input

- `.spec/requirements.md` [REQUIRED] - Validated requirements from Phase 1
- `.genesis/status.json` [REQUIRED] - Current project state

## Output

`.spec/design.md` - Technical architecture document with:
- System architecture diagram
- Component specifications
- Technology stack decisions
- Data models
- API contracts

## Workflow

1. **Analyze** - Review all FR-X and NFR-X requirements
2. **Decompose** - Identify logical components
3. **Map** - Link each requirement to components
4. **Select** - Choose technologies with justification
5. **Design** - Define interfaces and data flow
6. **Document** - Create design.md

## Output Format

```markdown
# Design: [Project Name]

## Architecture Overview
[High-level description of the system]

```
[ASCII or Mermaid diagram showing components and relationships]
```

## Components

### Component: [Name]
**Responsibility:** [Single responsibility description]
**Requirements:** FR-1, FR-2, NFR-1
**Technology:** [Choice]
**Justification:** [Why this technology]
**Interfaces:**
- Input: [What it receives]
- Output: [What it produces]

### Component: [Name]
...

## Technology Stack

| Layer | Technology | Version | Justification |
|-------|------------|---------|---------------|
| Frontend | [Tech] | [Ver] | [Why] |
| Backend | [Tech] | [Ver] | [Why] |
| Database | [Tech] | [Ver] | [Why] |
| Infrastructure | [Tech] | [Ver] | [Why] |

## Data Models

### [Entity Name]
```
{
  "field": "type - description"
}
```
**Used By:** [Components]
**Requirements:** FR-X

## API Contracts

### [Endpoint/Interface]
**Method:** GET | POST | PUT | DELETE
**Path:** /api/v1/resource
**Request:** [Schema]
**Response:** [Schema]
**Requirements:** FR-X

## NFR Addressing

| NFR | Solution |
|-----|----------|
| NFR-1 | [How architecture addresses it] |
| NFR-2 | [How architecture addresses it] |

## Security Considerations
- [Security measure 1]
- [Security measure 2]

## Traceability Matrix

| Requirement | Component(s) |
|-------------|--------------|
| FR-1 | Component A, Component B |
| NFR-1 | Component C |
```

## Rules

✅ ALLOWED:
- Propose technology choices with justification
- Add standard architectural patterns
- Include security and scalability considerations
- Create diagrams and visual representations
- Suggest data models based on requirements

❌ FORBIDDEN:
- Add components for unrequested features
- Choose technologies without justification
- Ignore any FR-X or NFR-X requirement
- Make assumptions about user preferences without noting
- Skip the traceability matrix

## Exit Criteria

- [ ] Architecture diagram present
- [ ] All FR-X mapped to at least one component
- [ ] All NFR-X addressed in design
- [ ] Technology stack specified with justifications
- [ ] Data models defined for all entities
- [ ] API contracts defined for all interfaces
- [ ] Traceability matrix complete

## Next

Run `GENESIS: VALIDATE` then `GENESIS: CHECKPOINT`
