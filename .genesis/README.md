# Genesis Framework

A deterministic, human-supervised software development workflow for AI-powered coding IDEs.

## Quick Start

1. **Load the orchestrator** into your AI coding assistant:
   ```
   .genesis/orchestrator-core.md
   ```
   The AI will load phase-specific prompts from `.genesis/prompts/` as needed.

2. **Initialize a project:**
   ```
   GENESIS: INIT "my-project"
   ```

3. **Approve to begin:**
   ```
   APPROVE
   ```

4. **Work through phases** — the AI will guide you through requirements, design, tasks, research, development, validation, and deployment.

## How It Works

The framework enforces a 7-phase workflow where each phase:
- Has a specific role (Product Owner, Architect, Tech Lead, etc.)
- Can only reference specific upstream artifacts (grounding)
- Requires human approval before advancing (supervision)
- Logs all actions for traceability (audit trail)

## Commands

| Command | What it does |
|---------|--------------|
| `GENESIS: INIT "name"` | Start a new project |
| `GENESIS: STATUS` | See current state |
| `GENESIS: VALIDATE` | Check phase exit criteria |
| `GENESIS: CHECKPOINT` | Request approval to advance |
| `APPROVE` | Advance to next phase |
| `REJECT "feedback"` | Revise current phase |
| `GENESIS: HALT "reason"` | Stop all work |
| `GENESIS: RESUME` | Continue after halt |
| `GENESIS: CHANGE "desc"` | Request a change (triggers cascade) |

## File Structure

```
project/
├── .genesis/
│   ├── orchestrator-core.md  # LOAD THIS — Core routing + state management (~100 lines)
│   ├── README.md             # This file (human docs)
│   ├── status.json           # State persistence
│   └── prompts/              # Role prompts (loaded per phase, ~60-80 lines each)
│       ├── product_owner.md
│       ├── architect.md
│       ├── tech_lead.md
│       ├── researcher.md
│       ├── developer.md
│       ├── validator.md
│       └── deployer.md
├── .spec/              # Specifications
│   ├── requirements.md # Phase 1 output
│   ├── design.md       # Phase 2 output
│   ├── tasks.md        # Phase 3 output
│   └── validation.md   # Phase 6 output
├── docs/               # Research (Phase 4)
├── src/                # Code (Phase 5)
└── .deploy/            # Deployment (Phase 7)
```

## Phases

| # | Role | Creates | From |
|---|------|---------|------|
| 1 | Product Owner | requirements.md | User's words |
| 2 | Architect | design.md | requirements |
| 3 | Tech Lead | tasks.md | design |
| 4 | Researcher | docs/* | tasks + external |
| 5 | Developer | src/* | tasks + docs |
| 6 | Validator | validation.md | src + requirements |
| 7 | Deployer | .deploy/* | validation |

## Key Concepts

**Grounding:** Each phase can only reference specific artifacts. The AI cannot invent requirements or assume technologies.

**Checkpoints:** Every phase transition requires explicit human approval. The AI cannot advance on its own.

**Change Cascade:** If you change an upstream artifact (e.g., requirements), all downstream artifacts are marked stale and must be regenerated.

**Error Handling:** Errors are logged, retried with alternatives, and escalated if persistent. The human always has visibility.

---

*Genesis Framework v1.0.0*
