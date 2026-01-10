## How Genesis Works Now

**Setup:** Load `.genesis/orchestrator-core.md` as the system prompt/steering file. That's it.

**Runtime Flow:**

```
┌─────────────────────────────────────────────────────────┐
│  User sends message                                     │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│  orchestrator-core.md (always loaded, ~100 lines)       │
│  1. Read status.json → get current phase                │
│  2. Report state banner                                 │
│  3. Check blockers (halted? checkpoint pending?)        │
│  4. Route command OR load current phase prompt          │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│  prompts/{role}.md (loaded on demand, ~70 lines)        │
│  - Phase-specific instructions                          │
│  - Output format                                        │
│  - Exit criteria                                        │
│  - Grounding rules                                      │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│  AI executes phase work, updates status.json            │
└─────────────────────────────────────────────────────────┘
```

**Example Session:**

```
User: GENESIS: INIT "my-api"

AI: [orchestrator-core handles INIT]
    📍 Project: my-api | Phase 0/7 | Status: AWAITING_APPROVAL
    Project initialized. Reply APPROVE to begin.

User: APPROVE

AI: [orchestrator-core advances phase, loads product_owner.md]
    📍 Project: my-api | Phase 1/7 | Status: IN_PROGRESS
    
    What would you like to build? Describe your requirements.

User: A REST API for task management with user authentication.

AI: [product_owner.md guides requirements extraction]
    [Creates .spec/requirements.md]
    
    Requirements documented. Run GENESIS: VALIDATE.

User: GENESIS: VALIDATE

AI: [product_owner.md checks exit criteria]
    ✅ All FR-X/NFR-X identified
    ✅ All cite Source
    ✅ All have acceptance criteria
    
    Ready for GENESIS: CHECKPOINT

User: GENESIS: CHECKPOINT

AI: 📍 Project: my-api | Phase 1/7 | Status: AWAITING_APPROVAL
    Reply APPROVE, REJECT "feedback", or SKIP "reason"

User: APPROVE

AI: [orchestrator-core advances, loads architect.md]
    📍 Project: my-api | Phase 2/7 | Status: IN_PROGRESS
    
    [Reads requirements.md, begins design...]
```

**What's loaded at each phase:**

| Phase | Loaded Prompts | Total Lines |
|-------|----------------|-------------|
| 1 | core + product_owner | ~170 |
| 2 | core + architect | ~170 |
| 3 | core + tech_lead | ~170 |
| 4 | core + researcher | ~170 |
| 5 | core + developer | ~180 |
| 6 | core + validator | ~180 |
| 7 | core + deployer | ~170 |

**Key difference from before:** The AI only carries ~170 lines of framework instructions instead of ~450, leaving more context window for actual project artifacts.