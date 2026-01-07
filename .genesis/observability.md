# Genesis Framework - Observability Dashboard

## Purpose
Track framework performance, identify bottlenecks, and enable continuous improvement through metrics collection and analysis.

---

## Quick Commands

| Command | Description |
|---------|-------------|
| `GENESIS: METRICS` | Display full dashboard |
| `GENESIS: METRICS EXPORT json` | Export as JSON |
| `GENESIS: METRICS EXPORT csv` | Export as CSV |
| `GENESIS: METRICS EXPORT md` | Export as Markdown |
| `GENESIS: SOFT-GATES` | Show soft gate violations |

---

## Metrics Categories

### 1. Phase Timing
Tracks duration and efficiency of each phase.

```yaml
metrics.phase_timing:
  phase_N:
    started: ISO-8601 timestamp
    completed: ISO-8601 timestamp
    duration_hours: float
    iterations: int
    wait_time_hours: float  # Time waiting for approval
```

**Key Indicators:**
- Duration > 2x average → Potential complexity issue
- High wait_time → Human bottleneck
- High iterations → Scope/clarity issues

### 2. Agent Performance
Tracks effectiveness of each specialized agent.

```yaml
metrics.agent_performance:
  [agent_name]:
    tasks_completed: int
    avg_iteration_count: float
    rejection_rate: float (0-1)
    avg_time_to_checkpoint_hours: float
    
  # Researcher-specific
  researcher:
    cache_hit_rate: float
    avg_fetch_time_seconds: float
    tier_usage: { tier_1: N, tier_2: N, ... }
```

**Key Indicators:**
- rejection_rate > 0.2 → Quality issues
- cache_hit_rate < 0.5 → Cache underutilized
- High tier_3+ usage → Documentation gaps

### 3. Failure Patterns
Identifies recurring issues across projects.

```yaml
metrics.failure_patterns[]:
  - pattern_id: "FP-XXX"
    description: string
    occurrences: int
    phases: [int]
    agents: [string]
    first_seen: timestamp
    last_seen: timestamp
    resolution: string | null
    status: "active" | "resolved" | "monitoring"
```

**Pattern Detection:**
- Same error fingerprint 3+ times
- Similar error messages across phases
- Correlated failures (A fails → B fails)

### 4. Bottleneck Detection
Automatically identifies slowdowns.

```yaml
metrics.bottlenecks[]:
  - phase: int
    agent: string
    metric: string
    value: float
    threshold: float
    severity: "info" | "warning" | "critical"
    suggestion: string
```

**Bottleneck Types:**
| Type | Threshold | Suggestion |
|------|-----------|------------|
| Phase duration | > 2x avg | Review scope |
| Checkpoint wait | > 48h | Async review |
| Iteration count | > max-1 | Use REJECT |
| Cache miss rate | > 50% | Enable cache |

---

## Dashboard Output Format

```
═══════════════════════════════════════════════════════════
                    GENESIS METRICS DASHBOARD
═══════════════════════════════════════════════════════════

PROJECT: [name]
DURATION: [X days, Y hours] (started [date])
CURRENT PHASE: [N] - [label]

PHASE TIMING
┌─────────┬──────────┬────────────┬──────────┬────────────┐
│ Phase   │ Duration │ Iterations │ Wait     │ Status     │
├─────────┼──────────┼────────────┼──────────┼────────────┤
│ 1-Req   │ 1.5h     │ 2          │ 0.5h     │ ✅ Complete │
│ 2-Design│ 3.4h     │ 1          │ 2.0h     │ ✅ Complete │
│ ...     │ ...      │ ...        │ ...      │ ...        │
└─────────┴──────────┴────────────┴──────────┴────────────┘

AGENT PERFORMANCE
┌───────────────┬───────┬────────────┬──────────┬──────────┐
│ Agent         │ Tasks │ Rejections │ Avg Time │ Special  │
├───────────────┼───────┼────────────┼──────────┼──────────┤
│ Product Owner │ 1     │ 0%         │ 1.5h     │ -        │
│ Researcher    │ 15    │ 5%         │ 0.5h/doc │ 65% cache│
│ Developer     │ 8/12  │ 8%         │ 3.1h/task│ -        │
│ ...           │ ...   │ ...        │ ...      │ ...      │
└───────────────┴───────┴────────────┴──────────┴──────────┘

RESEARCH SOURCES
┌────────┬───────┬────────────┐
│ Tier   │ Count │ Confidence │
├────────┼───────┼────────────┤
│ Tier 1 │ 12    │ 100%       │
│ Tier 2 │ 3     │ 85%        │
│ Tier 3 │ 0     │ 70%        │
└────────┴───────┴────────────┘
Avg Confidence: 96%

CACHE STATUS
  Entries: 15 (12 valid, 3 expired)
  Hit Rate: 65%
  Integrity: ✅ Verified

SOFT GATE VIOLATIONS
  ⚠️ documentation_completeness: 75% (threshold: 80%)
  ⚠️ test_coverage: 68% (threshold: 70%)
  Total: 2 warnings, 0 acknowledged

ACTIVE BOTTLENECKS
  ⚠️ Phase 5: High iteration count (5/5)
     → Consider using REJECT for major changes
  
FAILURE PATTERNS
  🔴 FP-002: Validation timeout (3x) - unresolved
  🟢 FP-001: Research fetch timeout - resolved

ROLLBACK STATUS
  Last Rollback: [date] or Never
  Archive Integrity: ✅ Verified
  Dry-Run Available: Yes

═══════════════════════════════════════════════════════════
```

---

## Automated Insights

On checkpoint or phase completion, the system analyzes metrics and generates insights:

### Anomaly Detection
```yaml
Triggers:
  - Phase duration > 2x historical average
  - Iteration count approaching max
  - Rejection rate > 20%
  - Cache hit rate < 50%
  - Multiple soft gate violations
```

### Insight Format
```
📊 Phase [N] Insights:
  - Duration [X]h (above average [Y]h)
  - [N] iterations used (max: [M])
  - Task [X.Y] took [Z]h (others avg [W]h)

💡 Suggestions:
  - [Actionable recommendation 1]
  - [Actionable recommendation 2]
```

---

## Export Formats

### JSON Export
```json
{
  "project": "My App",
  "exported_at": "2024-01-15T10:30:00Z",
  "metrics": {
    "phase_timing": { ... },
    "agent_performance": { ... },
    "failure_patterns": [ ... ],
    "bottlenecks": [ ... ]
  },
  "soft_gates": {
    "violations": [ ... ],
    "policy": "warn_and_continue"
  },
  "research_sources": {
    "usage_log": [ ... ],
    "tier_summary": { ... }
  }
}
```

### CSV Export
Tabular format suitable for spreadsheet analysis:
- `phases.csv` - Phase timing data
- `agents.csv` - Agent performance data
- `failures.csv` - Failure pattern data
- `sources.csv` - Research source usage

### Markdown Export
Human-readable report suitable for documentation or sharing.

---

## Configuration

```yaml
# In status.json → config
observability_enabled: true          # Enable/disable metrics
metrics_retention_days: 30           # How long to keep detailed metrics
bottleneck_detection_enabled: true   # Auto-detect bottlenecks
insight_generation_enabled: true     # Generate automated insights
```

---

## Best Practices

1. **Review metrics after each phase** - Catch issues early
2. **Address bottlenecks promptly** - Don't let them compound
3. **Track failure patterns** - Prevent recurring issues
4. **Export periodically** - Build historical baseline
5. **Use dry-run for rollbacks** - Verify before executing
