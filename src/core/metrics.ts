/**
 * Genesis Framework - Metrics (Simplified)
 * Foundation Reset: Basic metrics for audit trail
 * @version 2.0.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { GenesisStatus } from './types';

export class MetricsCollector {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  /**
   * Generate a simple status summary
   */
  async generateDashboard(): Promise<string> {
    const statusPath = path.join(this.workspacePath, '.genesis', 'status.json');
    
    try {
      const content = await fs.readFile(statusPath, 'utf-8');
      const status = JSON.parse(content) as GenesisStatus;
      
      return this.formatDashboard(status);
    } catch {
      return 'Unable to load status. Run GENESIS: STATUS instead.';
    }
  }

  private formatDashboard(status: GenesisStatus): string {
    const phaseLabel = status.phase.labels[status.phase.current];
    
    // Count completed phases
    const completedPhases = Object.values(status.progress).filter(v => v).length;
    
    // Count approvals and rejections from history
    const approvals = status.checkpoints.history.filter(h => h.response === 'APPROVE').length;
    const rejections = status.checkpoints.history.filter(h => h.response === 'REJECT').length;
    const skips = status.checkpoints.history.filter(h => h.response === 'SKIP').length;
    
    return `
═══════════════════════════════════════════════════════════
                    GENESIS SUMMARY
═══════════════════════════════════════════════════════════

PROJECT: ${status.project.name || 'Not initialized'}
CURRENT PHASE: ${status.phase.current} - ${phaseLabel}
STATUS: ${status.phase.status}

PROGRESS:
  Phases Completed: ${completedPhases}/7
  Iterations Used: ${status.iteration.count}/${status.iteration.max}

CHECKPOINT HISTORY:
  Approvals: ${approvals}
  Rejections: ${rejections}
  Skips: ${skips}

ERRORS:
  Active: ${status.errors.active.length}
  Total: ${status.errors.count}

TRANSITIONS: ${status.transitions.length}

═══════════════════════════════════════════════════════════`;
  }

  /**
   * Export metrics to file
   */
  async export(format: 'json' | 'csv' | 'md'): Promise<string> {
    const statusPath = path.join(this.workspacePath, '.genesis', 'status.json');
    const content = await fs.readFile(statusPath, 'utf-8');
    const status = JSON.parse(content) as GenesisStatus;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `genesis-export-${timestamp}.${format}`;
    const exportPath = path.join(this.workspacePath, '.genesis', filename);
    
    let exportContent: string;
    
    switch (format) {
      case 'json':
        exportContent = JSON.stringify({
          project: status.project,
          phase: status.phase,
          progress: status.progress,
          checkpoints: status.checkpoints,
          transitions: status.transitions,
          errors: status.errors,
          exported_at: new Date().toISOString()
        }, null, 2);
        break;
        
      case 'csv':
        exportContent = this.toCSV(status);
        break;
        
      case 'md':
        exportContent = this.toMarkdown(status);
        break;
    }
    
    await fs.writeFile(exportPath, exportContent, 'utf-8');
    return exportPath;
  }

  private toCSV(status: GenesisStatus): string {
    const lines = ['timestamp,event,phase,response,feedback'];
    
    for (const entry of status.checkpoints.history) {
      lines.push(`${entry.resolved_at},checkpoint,${entry.phase},${entry.response},"${entry.feedback || ''}"`);
    }
    
    for (const entry of status.transitions) {
      lines.push(`${entry.timestamp},transition,${entry.to_phase},${entry.trigger},""`);
    }
    
    return lines.join('\n');
  }

  private toMarkdown(status: GenesisStatus): string {
    const completedPhases = Object.values(status.progress).filter(v => v).length;
    const approvals = status.checkpoints.history.filter(h => h.response === 'APPROVE').length;
    const rejections = status.checkpoints.history.filter(h => h.response === 'REJECT').length;
    
    return `# Genesis Project Report

## Project: ${status.project.name || 'Unnamed'}

**Created:** ${status.project.created || 'N/A'}
**Last Updated:** ${status.project.updated || 'N/A'}
**Current Phase:** ${status.phase.current} - ${status.phase.labels[status.phase.current]}

## Progress

- Phases Completed: ${completedPhases}/7
- Iterations: ${status.iteration.count}/${status.iteration.max}
- Approvals: ${approvals}
- Rejections: ${rejections}

## Checkpoint History

| Time | Phase | Response | Feedback |
|------|-------|----------|----------|
${status.checkpoints.history.map(h => 
  `| ${h.resolved_at} | ${h.phase} | ${h.response} | ${h.feedback || '-'} |`
).join('\n')}

## Transitions

| Time | From | To | Trigger |
|------|------|-----|---------|
${status.transitions.map(t => 
  `| ${t.timestamp} | ${t.from_phase} | ${t.to_phase} | ${t.trigger} |`
).join('\n')}

---
*Exported: ${new Date().toISOString()}*
`;
  }
}

export default MetricsCollector;
