/**
 * Genesis Framework - Metrics Collector
 * Implements observability dashboard and metrics export
 * @version 1.0.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { GenesisStatus, Phase, AgentName } from './types';

export class MetricsCollector {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  async generateDashboard(): Promise<string> {
    const statusPath = path.join(this.workspacePath, '.genesis', 'status.json');
    const content = await fs.readFile(statusPath, 'utf-8');
    const status: GenesisStatus = JSON.parse(content);

    const projectDuration = this.calculateProjectDuration(status);
    const phaseTable = this.generatePhaseTable(status);
    const agentTable = this.generateAgentTable(status);
    const researchStats = this.generateResearchStats(status);
    const bottlenecks = this.detectBottlenecks(status);
    const patterns = this.getFailurePatterns(status);

    return `
═══════════════════════════════════════════════════════════
                    GENESIS METRICS DASHBOARD
═══════════════════════════════════════════════════════════

PROJECT: ${status.project.name || 'Not initialized'}
DURATION: ${projectDuration}
CURRENT PHASE: ${status.phase.current} - ${status.phase.labels[status.phase.current]}

PHASE TIMING
${phaseTable}

AGENT PERFORMANCE
${agentTable}

RESEARCH SOURCES
${researchStats}

CACHE STATUS
  Entries: ${Object.keys(status.research_cache.entries).length}
  Hit Rate: ${this.calculateCacheHitRate(status)}
  Integrity: ${status.research_cache.integrity.status}

SOFT GATE VIOLATIONS
  Total: ${status.soft_gates.violations.length}
  Acknowledged: ${status.soft_gates.violations.filter(v => v.acknowledged).length}

${bottlenecks.length > 0 ? `ACTIVE BOTTLENECKS\n${bottlenecks.map(b => `  ⚠️ ${b}`).join('\n')}` : 'NO ACTIVE BOTTLENECKS'}

${patterns.length > 0 ? `FAILURE PATTERNS\n${patterns.map(p => `  ${p.status === 'resolved' ? '🟢' : '🔴'} ${p.pattern_id}: ${p.description} (${p.occurrences}x)`).join('\n')}` : 'NO FAILURE PATTERNS'}

SUMMARY METRICS
  Phases Completed: ${status.metrics.phases_completed}
  Checkpoints Approved: ${status.metrics.checkpoints_approved}
  Checkpoints Rejected: ${status.metrics.checkpoints_rejected}
  Total Iterations: ${status.metrics.iterations_total}
  Total Errors: ${status.metrics.errors_total}
  Errors Resolved: ${status.metrics.errors_resolved}
  Rollbacks: ${status.metrics.rollbacks}

═══════════════════════════════════════════════════════════`;
  }

  private calculateProjectDuration(status: GenesisStatus): string {
    if (!status.project.created) return 'Not started';
    
    const start = new Date(status.project.created);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} days, ${hours} hours (started ${start.toISOString().split('T')[0]})`;
    }
    return `${hours} hours (started ${start.toISOString().split('T')[0]})`;
  }

  private generatePhaseTable(status: GenesisStatus): string {
    const rows: string[] = [];
    rows.push('┌─────────┬──────────┬────────────┬────────────┐');
    rows.push('│ Phase   │ Duration │ Iterations │ Status     │');
    rows.push('├─────────┼──────────┼────────────┼────────────┤');

    for (let i = 1; i <= 7; i++) {
      const timing = status.metrics.phase_timing[`phase_${i}`];
      const label = status.phase.labels[i as Phase].substring(0, 7).padEnd(7);
      const duration = timing?.duration_hours ? `${timing.duration_hours}h`.padEnd(8) : '-'.padEnd(8);
      const iterations = '-'.padEnd(10); // Would need to track per-phase
      
      let statusIcon = '⚪ Pending';
      if (timing?.completed) statusIcon = '✅ Complete';
      else if (timing?.started) statusIcon = '🟡 Active';
      
      rows.push(`│ ${i}-${label}│ ${duration} │ ${iterations} │ ${statusIcon.padEnd(10)} │`);
    }

    rows.push('└─────────┴──────────┴────────────┴────────────┘');
    return rows.join('\n');
  }

  private generateAgentTable(status: GenesisStatus): string {
    const rows: string[] = [];
    rows.push('┌───────────────┬───────┬────────────┬──────────┐');
    rows.push('│ Agent         │ Tasks │ Rejections │ Avg Time │');
    rows.push('├───────────────┼───────┼────────────┼──────────┤');

    const agents: AgentName[] = ['product_owner', 'architect', 'tech_lead', 'researcher', 'developer', 'validator', 'deployer'];
    
    for (const agent of agents) {
      const perf = status.metrics.agent_performance[agent];
      const name = agent.replace('_', ' ').substring(0, 13).padEnd(13);
      const tasks = String(perf?.tasks_completed || 0).padEnd(5);
      const rejections = `${Math.round((perf?.rejection_rate || 0) * 100)}%`.padEnd(10);
      const avgTime = '-'.padEnd(8);
      
      rows.push(`│ ${name} │ ${tasks} │ ${rejections} │ ${avgTime} │`);
    }

    rows.push('└───────────────┴───────┴────────────┴──────────┘');
    return rows.join('\n');
  }

  private generateResearchStats(status: GenesisStatus): string {
    const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalConfidence = 0;

    for (const usage of status.research_sources.usage_log) {
      tierCounts[usage.tier] = (tierCounts[usage.tier] || 0) + 1;
      totalConfidence += usage.confidence;
    }

    const total = status.research_sources.usage_log.length;
    const avgConfidence = total > 0 ? Math.round(totalConfidence / total) : 0;

    const rows: string[] = [];
    rows.push('┌────────┬───────┬────────────┐');
    rows.push('│ Tier   │ Count │ Confidence │');
    rows.push('├────────┼───────┼────────────┤');

    for (let tier = 1; tier <= 5; tier++) {
      const conf = status.research_sources.tiers[`tier_${tier}_${this.getTierName(tier)}`]?.confidence || 0;
      rows.push(`│ Tier ${tier} │ ${String(tierCounts[tier]).padEnd(5)} │ ${String(conf + '%').padEnd(10)} │`);
    }

    rows.push('└────────┴───────┴────────────┘');
    rows.push(`Avg Confidence: ${avgConfidence}%`);

    return rows.join('\n');
  }

  private getTierName(tier: number): string {
    const names: Record<number, string> = {
      1: 'official',
      2: 'github',
      3: 'registry',
      4: 'community',
      5: 'fallback'
    };
    return names[tier] || 'unknown';
  }

  private calculateCacheHitRate(_status: GenesisStatus): string {
    // Would need actual cache statistics
    return 'N/A';
  }

  private detectBottlenecks(status: GenesisStatus): string[] {
    const bottlenecks: string[] = [];

    // Check iteration count
    if (status.iteration.iteration_count >= status.iteration.max_iterations - 1) {
      bottlenecks.push(`Phase ${status.phase.current}: High iteration count (${status.iteration.iteration_count}/${status.iteration.max_iterations})`);
    }

    // Check for long-running phases
    for (const [key, timing] of Object.entries(status.metrics.phase_timing)) {
      if (timing.started && !timing.completed) {
        const started = new Date(timing.started);
        const hours = (Date.now() - started.getTime()) / (1000 * 60 * 60);
        if (hours > 24) {
          bottlenecks.push(`${key}: Running for ${Math.round(hours)} hours`);
        }
      }
    }

    return bottlenecks;
  }

  private getFailurePatterns(status: GenesisStatus): typeof status.metrics.failure_patterns {
    return status.metrics.failure_patterns;
  }

  async export(format: 'json' | 'csv' | 'md'): Promise<string> {
    const statusPath = path.join(this.workspacePath, '.genesis', 'status.json');
    const content = await fs.readFile(statusPath, 'utf-8');
    const status: GenesisStatus = JSON.parse(content);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportsDir = path.join(this.workspacePath, '.genesis', 'reports');
    await fs.mkdir(reportsDir, { recursive: true });

    let exportContent: string;
    let filename: string;

    switch (format) {
      case 'json':
        filename = `metrics-${timestamp}.json`;
        exportContent = JSON.stringify({
          project: status.project.name,
          exported_at: new Date().toISOString(),
          metrics: status.metrics,
          soft_gates: status.soft_gates,
          research_sources: {
            usage_log: status.research_sources.usage_log,
            tier_summary: this.summarizeTiers(status)
          }
        }, null, 2);
        break;

      case 'csv':
        filename = `metrics-${timestamp}.csv`;
        exportContent = this.generateCSV(status);
        break;

      case 'md':
        filename = `metrics-${timestamp}.md`;
        exportContent = await this.generateMarkdownReport(status);
        break;

      default:
        throw new Error(`Unknown format: ${format}`);
    }

    const exportPath = path.join(reportsDir, filename);
    await fs.writeFile(exportPath, exportContent);

    return exportPath;
  }

  private summarizeTiers(status: GenesisStatus): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const usage of status.research_sources.usage_log) {
      const key = `tier_${usage.tier}`;
      summary[key] = (summary[key] || 0) + 1;
    }
    return summary;
  }

  private generateCSV(status: GenesisStatus): string {
    const lines: string[] = [];

    // Phase timing
    lines.push('Phase Timing');
    lines.push('Phase,Started,Completed,Duration (hours)');
    for (let i = 1; i <= 7; i++) {
      const timing = status.metrics.phase_timing[`phase_${i}`];
      lines.push(`${i},${timing?.started || ''},${timing?.completed || ''},${timing?.duration_hours || ''}`);
    }

    lines.push('');

    // Agent performance
    lines.push('Agent Performance');
    lines.push('Agent,Tasks Completed,Avg Iterations,Rejection Rate');
    for (const [agent, perf] of Object.entries(status.metrics.agent_performance)) {
      lines.push(`${agent},${perf.tasks_completed},${perf.avg_iteration_count},${perf.rejection_rate}`);
    }

    return lines.join('\n');
  }

  private async generateMarkdownReport(status: GenesisStatus): Promise<string> {
    return `# Genesis Metrics Report

## Project: ${status.project.name}

**Generated:** ${new Date().toISOString()}
**Current Phase:** ${status.phase.current} - ${status.phase.labels[status.phase.current]}

## Summary

| Metric | Value |
|--------|-------|
| Phases Completed | ${status.metrics.phases_completed} |
| Checkpoints Approved | ${status.metrics.checkpoints_approved} |
| Checkpoints Rejected | ${status.metrics.checkpoints_rejected} |
| Total Iterations | ${status.metrics.iterations_total} |
| Total Errors | ${status.metrics.errors_total} |
| Errors Resolved | ${status.metrics.errors_resolved} |
| Rollbacks | ${status.metrics.rollbacks} |

## Phase Timing

| Phase | Started | Completed | Duration |
|-------|---------|-----------|----------|
${[1, 2, 3, 4, 5, 6, 7].map(i => {
  const timing = status.metrics.phase_timing[`phase_${i}`];
  return `| ${i} - ${status.phase.labels[i as Phase]} | ${timing?.started || '-'} | ${timing?.completed || '-'} | ${timing?.duration_hours ? timing.duration_hours + 'h' : '-'} |`;
}).join('\n')}

## Agent Performance

| Agent | Tasks | Rejection Rate |
|-------|-------|----------------|
${Object.entries(status.metrics.agent_performance).map(([agent, perf]) => 
  `| ${agent} | ${perf.tasks_completed} | ${Math.round(perf.rejection_rate * 100)}% |`
).join('\n')}

## Soft Gate Violations

${status.soft_gates.violations.length === 0 ? 'No violations recorded.' : 
  status.soft_gates.violations.map(v => `- **${v.rule}**: ${v.actual}% (threshold: ${v.threshold}%)`).join('\n')}

## Failure Patterns

${status.metrics.failure_patterns.length === 0 ? 'No failure patterns detected.' :
  status.metrics.failure_patterns.map(p => `- **${p.pattern_id}**: ${p.description} (${p.occurrences} occurrences) - ${p.status}`).join('\n')}
`;
  }
}

export default MetricsCollector;
