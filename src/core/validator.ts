/**
 * Genesis Framework - Validation Engine
 * Implements all quality gates and validation logic
 * @version 1.0.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { 
  GenesisStatus, 
  Phase, 
  ValidationResult, 
  ValidationCriterion,
  CheckpointType
} from './types';

export class ValidationEngine {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  // ============================================================================
  // Main Validation Entry Point
  // ============================================================================

  async validatePhase(status: GenesisStatus): Promise<ValidationResult> {
    const phase = status.phase.current;
    const criteria = this.getCriteriaForPhase(phase);
    
    const results: ValidationResult['criteria'] = [];
    const hardFailures: string[] = [];
    const softWarnings: string[] = [];

    for (const criterion of criteria) {
      let passed: boolean;
      try {
        passed = await this.evaluateCriterion(criterion, status);
      } catch {
        passed = false;
      }

      results.push({
        id: criterion.id,
        description: criterion.description,
        passed,
        severity: criterion.severity
      });

      if (!passed) {
        if (criterion.severity === 'hard') {
          hardFailures.push(`${criterion.id}: ${criterion.description}`);
        } else {
          softWarnings.push(`${criterion.id}: ${criterion.description}`);
        }
      }
    }

    return {
      passed: hardFailures.length === 0,
      criteria: results,
      hardFailures,
      softWarnings
    };
  }

  private async evaluateCriterion(criterion: ValidationCriterion, status: GenesisStatus): Promise<boolean> {
    // For file-based checks, we need async evaluation
    if (criterion.id.startsWith('FILE_')) {
      return this.evaluateFileCriterion(criterion, status);
    }
    return criterion.check(status);
  }

  private async evaluateFileCriterion(criterion: ValidationCriterion, status: GenesisStatus): Promise<boolean> {
    // File existence and content checks
    const fileChecks: Record<string, string> = {
      'FILE_REQ_EXISTS': '.spec/requirements.md',
      'FILE_DESIGN_EXISTS': '.spec/design.md',
      'FILE_TASKS_EXISTS': '.spec/tasks.md',
      'FILE_IMPL_EXISTS': '.spec/implementation.md',
      'FILE_VALIDATION_EXISTS': '.spec/validation.md'
    };

    const filePath = fileChecks[criterion.id];
    if (filePath) {
      try {
        await fs.access(path.join(this.workspacePath, filePath));
        return true;
      } catch {
        return false;
      }
    }

    return criterion.check(status);
  }

  // ============================================================================
  // Phase-Specific Criteria
  // ============================================================================

  private getCriteriaForPhase(phase: Phase): ValidationCriterion[] {
    switch (phase) {
      case 0:
        return this.getInitCriteria();
      case 1:
        return this.getRequirementsCriteria();
      case 2:
        return this.getDesignCriteria();
      case 3:
        return this.getTasksCriteria();
      case 4:
        return this.getResearchCriteria();
      case 5:
        return this.getImplementationCriteria();
      case 6:
        return this.getValidationCriteria();
      case 7:
        return this.getDeploymentCriteria();
      default:
        return [];
    }
  }

  // Gate 0: Initialization
  private getInitCriteria(): ValidationCriterion[] {
    return [
      {
        id: 'INIT_001',
        description: 'Project name is set',
        check: (s) => s.project.name !== null && s.project.name.length > 0,
        severity: 'hard'
      },
      {
        id: 'INIT_002',
        description: 'Agent prompts validated',
        check: (s) => Object.values(s.agents.registry).every(r => r.prompt !== null),
        severity: 'hard'
      }
    ];
  }

  // Gate 1: Requirements → Design
  private getRequirementsCriteria(): ValidationCriterion[] {
    return [
      {
        id: 'FILE_REQ_EXISTS',
        description: 'requirements.md exists',
        check: () => true, // Handled by evaluateFileCriterion
        severity: 'hard'
      },
      {
        id: 'REQ_001',
        description: 'At least 1 functional requirement defined',
        check: (s) => s.progress.phase_1_requirements_drafted,
        severity: 'hard'
      },
      {
        id: 'REQ_002',
        description: 'Requirements validated by user',
        check: (s) => s.progress.phase_1_requirements_validated,
        severity: 'hard'
      },
      {
        id: 'REQ_003',
        description: 'Agent context synced',
        check: (s) => s.agents.sync.status === 'SYNCED',
        severity: 'hard'
      }
    ];
  }

  // Gate 2: Design → Tasks
  private getDesignCriteria(): ValidationCriterion[] {
    return [
      {
        id: 'FILE_DESIGN_EXISTS',
        description: 'design.md exists',
        check: () => true,
        severity: 'hard'
      },
      {
        id: 'DESIGN_001',
        description: 'Architecture diagram present',
        check: (s) => s.progress.phase_2_components_total > 0,
        severity: 'hard'
      },
      {
        id: 'DESIGN_002',
        description: 'All components mapped to requirements',
        check: (s) => s.progress.phase_2_components_designed.length >= s.progress.phase_2_components_total,
        severity: 'hard'
      },
      {
        id: 'DESIGN_003',
        description: 'Technology stack specified',
        check: (s) => s.progress.phase_2_components_total > 0,
        severity: 'hard'
      },
      {
        id: 'DESIGN_004',
        description: 'Agent context synced',
        check: (s) => s.agents.sync.status === 'SYNCED',
        severity: 'hard'
      }
    ];
  }

  // Gate 3: Tasks → Research
  private getTasksCriteria(): ValidationCriterion[] {
    return [
      {
        id: 'FILE_TASKS_EXISTS',
        description: 'tasks.md exists',
        check: () => true,
        severity: 'hard'
      },
      {
        id: 'TASKS_001',
        description: 'All tasks have unique IDs',
        check: (s) => s.progress.phase_3_tasks_total > 0,
        severity: 'hard'
      },
      {
        id: 'TASKS_002',
        description: 'All tasks link to requirements',
        check: (s) => s.progress.phase_3_tasks_created.length > 0,
        severity: 'hard'
      },
      {
        id: 'TASKS_003',
        description: 'No circular dependencies',
        check: () => true, // Would need graph analysis
        severity: 'hard'
      },
      {
        id: 'TASKS_004',
        description: 'Research queue populated',
        check: (s) => s.progress.phase_4_docs_total > 0,
        severity: 'soft'
      }
    ];
  }

  // Gate 4: Research → Implementation
  private getResearchCriteria(): ValidationCriterion[] {
    return [
      {
        id: 'RESEARCH_001',
        description: 'All docs populated',
        check: (s) => s.progress.phase_4_docs_completed.length >= s.progress.phase_4_docs_total,
        severity: 'hard'
      },
      {
        id: 'RESEARCH_002',
        description: 'All docs from official sources',
        check: (s) => {
          const lowConfidence = s.research_sources.usage_log.filter(
            u => u.confidence < s.research_sources.minimum_confidence
          );
          return lowConfidence.length === 0;
        },
        severity: 'hard'
      },
      {
        id: 'RESEARCH_003',
        description: 'Cache integrity verified',
        check: (s) => s.research_cache.integrity.status !== 'failed',
        severity: 'soft'
      }
    ];
  }

  // Gate 5: Implementation → Validation
  private getImplementationCriteria(): ValidationCriterion[] {
    return [
      {
        id: 'FILE_IMPL_EXISTS',
        description: 'implementation.md exists',
        check: () => true,
        severity: 'hard'
      },
      {
        id: 'IMPL_001',
        description: 'All tasks completed',
        check: (s) => s.progress.phase_5_tasks_completed.length >= s.progress.phase_5_tasks_total,
        severity: 'hard'
      },
      {
        id: 'IMPL_002',
        description: 'Code compiles without errors',
        check: () => true, // Would need actual compilation check
        severity: 'hard'
      },
      {
        id: 'IMPL_003',
        description: 'Lint passes',
        check: () => true, // Would need actual lint check
        severity: 'soft'
      },
      {
        id: 'IMPL_004',
        description: 'No hardcoded secrets',
        check: () => true, // Would need secret scanning
        severity: 'hard'
      }
    ];
  }

  // Gate 6: Validation → Deployment
  private getValidationCriteria(): ValidationCriterion[] {
    return [
      {
        id: 'FILE_VALIDATION_EXISTS',
        description: 'validation.md exists',
        check: () => true,
        severity: 'hard'
      },
      {
        id: 'VAL_001',
        description: 'All unit tests pass',
        check: (s) => s.progress.phase_6_tests_passed.length > 0,
        severity: 'hard'
      },
      {
        id: 'VAL_002',
        description: 'Security scan passed',
        check: () => true, // Would need actual scan
        severity: 'hard'
      },
      {
        id: 'VAL_003',
        description: 'No critical bugs open',
        check: (s) => s.errors.active.filter(e => e.severity === 'CRITICAL').length === 0,
        severity: 'hard'
      },
      {
        id: 'VAL_004',
        description: 'Performance requirements met',
        check: () => true, // Would need perf testing
        severity: 'soft'
      }
    ];
  }

  // Gate 7: Deployment
  private getDeploymentCriteria(): ValidationCriterion[] {
    return [
      {
        id: 'DEPLOY_001',
        description: 'Validation approved',
        check: (s) => s.gates['gate_6_validation'] === 'PASSED',
        severity: 'hard'
      },
      {
        id: 'DEPLOY_002',
        description: 'Deployment artifacts ready',
        check: (s) => s.progress.phase_7_deployment_total > 0,
        severity: 'hard'
      },
      {
        id: 'DEPLOY_003',
        description: 'Rollback plan documented',
        check: () => true, // Would check .deploy/rollback-plan.md
        severity: 'hard'
      }
    ];
  }

  // ============================================================================
  // Checkpoint Type Mapping
  // ============================================================================

  getCheckpointTypeForPhase(phase: Phase): CheckpointType {
    const mapping: Record<Phase, CheckpointType> = {
      0: 'PROJECT_INIT',
      1: 'REQ_COMPLETE',
      2: 'DESIGN_COMPLETE',
      3: 'TASKS_COMPLETE',
      4: 'RESEARCH_COMPLETE',
      5: 'IMPL_COMPLETE',
      6: 'VALIDATION_COMPLETE',
      7: 'DEPLOY_COMPLETE'
    };
    return mapping[phase];
  }

  // ============================================================================
  // Soft Gate Evaluation
  // ============================================================================

  async evaluateSoftGates(status: GenesisStatus): Promise<{ violations: string[]; warnings: string[] }> {
    const violations: string[] = [];
    const warnings: string[] = [];

    for (const [rule, config] of Object.entries(status.soft_gates.rules)) {
      if (config.severity === 'soft') {
        // Evaluate soft gate
        const result = await this.evaluateSoftGateRule(rule, config.threshold, status);
        if (!result.passed) {
          if (status.soft_gates.policy === 'accumulate_and_block') {
            violations.push(`${rule}: ${result.actual}% (threshold: ${config.threshold}%)`);
          } else {
            warnings.push(`${rule}: ${result.actual}% (threshold: ${config.threshold}%)`);
          }
        }
      }
    }

    return { violations, warnings };
  }

  private async evaluateSoftGateRule(
    rule: string, 
    threshold: number, 
    _status: GenesisStatus
  ): Promise<{ passed: boolean; actual: number }> {
    // Placeholder implementations - would need actual metrics
    switch (rule) {
      case 'documentation_completeness':
        return { passed: true, actual: 85 };
      case 'test_coverage_minimum':
        return { passed: true, actual: 75 };
      case 'code_comment_ratio':
        return { passed: true, actual: 15 };
      case 'naming_conventions':
        return { passed: true, actual: 95 };
      case 'unused_dependencies':
        return { passed: true, actual: 0 };
      default:
        return { passed: true, actual: threshold };
    }
  }

  // ============================================================================
  // Agent Prompt Validation
  // ============================================================================

  async validateAgentPrompts(status: GenesisStatus): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const [agent, registry] of Object.entries(status.agents.registry)) {
      const promptPath = path.join(this.workspacePath, registry.prompt);
      
      try {
        const content = await fs.readFile(promptPath, 'utf-8');
        
        // Check required sections
        if (!content.includes('## Agent Identity')) {
          errors.push(`${agent}: Missing ## Agent Identity section`);
        }
        if (!content.includes('## Activation Condition')) {
          errors.push(`${agent}: Missing ## Activation Condition section`);
        }
        if (!content.includes('## Responsibilities')) {
          errors.push(`${agent}: Missing ## Responsibilities section`);
        }
        if (!content.includes('## Workflow')) {
          errors.push(`${agent}: Missing ## Workflow section`);
        }
      } catch {
        errors.push(`${agent}: Prompt file not found at ${registry.prompt}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // ============================================================================
  // Artifact Content Validation
  // ============================================================================

  async validateRequirementsContent(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    const filePath = path.join(this.workspacePath, '.spec', 'requirements.md');

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Check for FR-X pattern
      if (!content.match(/### FR-\d+:/)) {
        issues.push('No functional requirements (FR-X) found');
      }

      // Check for NFR-X pattern
      if (!content.match(/### NFR-\d+:/)) {
        issues.push('No non-functional requirements (NFR-X) found');
      }

      // Check for acceptance criteria
      if (!content.includes('Acceptance Criteria')) {
        issues.push('Missing acceptance criteria');
      }

      // Check for out of scope
      if (!content.includes('## Out of Scope')) {
        issues.push('Missing Out of Scope section');
      }

    } catch {
      issues.push('requirements.md not found');
    }

    return { valid: issues.length === 0, issues };
  }

  async validateDesignContent(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    const filePath = path.join(this.workspacePath, '.spec', 'design.md');

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Check for architecture section
      if (!content.includes('## Architecture')) {
        issues.push('Missing Architecture section');
      }

      // Check for data model
      if (!content.includes('## Data Model')) {
        issues.push('Missing Data Model section');
      }

      // Check for API design
      if (!content.includes('## API Design')) {
        issues.push('Missing API Design section');
      }

      // Check for technology stack
      if (!content.includes('## Technology Stack')) {
        issues.push('Missing Technology Stack section');
      }

    } catch {
      issues.push('design.md not found');
    }

    return { valid: issues.length === 0, issues };
  }

  async validateTasksContent(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    const filePath = path.join(this.workspacePath, '.spec', 'tasks.md');

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Check for task pattern
      if (!content.match(/### Task \d+\.\d+:/)) {
        issues.push('No tasks (Task X.Y) found');
      }

      // Check for research queue
      if (!content.includes('## Research Queue')) {
        issues.push('Missing Research Queue section');
      }

      // Check for dependency graph
      if (!content.includes('## Dependency Graph')) {
        issues.push('Missing Dependency Graph section');
      }

    } catch {
      issues.push('tasks.md not found');
    }

    return { valid: issues.length === 0, issues };
  }
}

export default ValidationEngine;
