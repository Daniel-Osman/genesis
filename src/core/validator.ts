/**
 * Genesis Framework - Validation Engine
 * Foundation Reset: Simplified validation with clear pass/fail criteria
 * @version 2.0.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { 
  GenesisStatus,
  ValidationResult
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
    
    switch (phase) {
      case 1:
        return this.validateRequirements();
      case 2:
        return this.validateDesign();
      case 3:
        return this.validateTasks();
      case 4:
        return this.validateResearch();
      case 5:
        return this.validateImplementation();
      case 6:
        return this.validateValidation();
      case 7:
        return this.validateDeployment();
      default:
        return {
          passed: false,
          phase,
          criteria: [],
          failures: ['Invalid phase for validation'],
          warnings: []
        };
    }
  }

  // ============================================================================
  // Phase 1: Requirements Validation
  // ============================================================================

  private async validateRequirements(): Promise<ValidationResult> {
    const results: ValidationResult = {
      passed: true,
      phase: 1,
      criteria: [],
      failures: [],
      warnings: []
    };

    // Check file exists
    const reqPath = path.join(this.workspacePath, '.spec', 'requirements.md');
    const fileExists = await this.fileExists(reqPath);
    
    results.criteria.push({
      id: 'REQ-001',
      description: 'requirements.md exists',
      passed: fileExists,
      required: true
    });

    if (!fileExists) {
      results.passed = false;
      results.failures.push('requirements.md not found in .spec/');
      return results;
    }

    // Read and analyze content
    const content = await fs.readFile(reqPath, 'utf-8');

    // Check for FR-X pattern
    const hasFR = /FR-\d+/i.test(content);
    results.criteria.push({
      id: 'REQ-002',
      description: 'At least one functional requirement (FR-X)',
      passed: hasFR,
      required: true
    });
    if (!hasFR) {
      results.passed = false;
      results.failures.push('No functional requirements found (expected FR-1, FR-2, etc.)');
    }

    // Check for NFR-X pattern (optional)
    const hasNFR = /NFR-\d+/i.test(content);
    results.criteria.push({
      id: 'REQ-003',
      description: 'At least one non-functional requirement (NFR-X)',
      passed: hasNFR,
      required: false
    });
    if (!hasNFR) {
      results.warnings.push('No non-functional requirements found (consider adding NFR-1, etc.)');
    }

    // Check for acceptance criteria
    const hasAcceptance = /acceptance|criteria|given|when|then/i.test(content);
    results.criteria.push({
      id: 'REQ-004',
      description: 'Requirements have acceptance criteria',
      passed: hasAcceptance,
      required: true
    });
    if (!hasAcceptance) {
      results.passed = false;
      results.failures.push('No acceptance criteria found');
    }

    return results;
  }

  // ============================================================================
  // Phase 2: Design Validation
  // ============================================================================

  private async validateDesign(): Promise<ValidationResult> {
    const results: ValidationResult = {
      passed: true,
      phase: 2,
      criteria: [],
      failures: [],
      warnings: []
    };

    const designPath = path.join(this.workspacePath, '.spec', 'design.md');
    const fileExists = await this.fileExists(designPath);

    results.criteria.push({
      id: 'DES-001',
      description: 'design.md exists',
      passed: fileExists,
      required: true
    });

    if (!fileExists) {
      results.passed = false;
      results.failures.push('design.md not found in .spec/');
      return results;
    }

    const content = await fs.readFile(designPath, 'utf-8');

    // Check for architecture section
    const hasArchitecture = /architecture|system design|component/i.test(content);
    results.criteria.push({
      id: 'DES-002',
      description: 'Architecture section present',
      passed: hasArchitecture,
      required: true
    });
    if (!hasArchitecture) {
      results.passed = false;
      results.failures.push('No architecture section found');
    }

    // Check for tech stack
    const hasTechStack = /tech stack|technology|framework|library/i.test(content);
    results.criteria.push({
      id: 'DES-003',
      description: 'Technology stack defined',
      passed: hasTechStack,
      required: true
    });
    if (!hasTechStack) {
      results.passed = false;
      results.failures.push('No technology stack defined');
    }

    // Check for requirement traceability
    const hasTraceability = /FR-\d+|NFR-\d+/i.test(content);
    results.criteria.push({
      id: 'DES-004',
      description: 'Design traces to requirements',
      passed: hasTraceability,
      required: false
    });
    if (!hasTraceability) {
      results.warnings.push('Design does not reference requirements (FR-X, NFR-X)');
    }

    return results;
  }

  // ============================================================================
  // Phase 3: Tasks Validation
  // ============================================================================

  private async validateTasks(): Promise<ValidationResult> {
    const results: ValidationResult = {
      passed: true,
      phase: 3,
      criteria: [],
      failures: [],
      warnings: []
    };

    const tasksPath = path.join(this.workspacePath, '.spec', 'tasks.md');
    const fileExists = await this.fileExists(tasksPath);

    results.criteria.push({
      id: 'TSK-001',
      description: 'tasks.md exists',
      passed: fileExists,
      required: true
    });

    if (!fileExists) {
      results.passed = false;
      results.failures.push('tasks.md not found in .spec/');
      return results;
    }

    const content = await fs.readFile(tasksPath, 'utf-8');

    // Check for task IDs
    const hasTaskIds = /Task \d+\.\d+|TASK-\d+/i.test(content);
    results.criteria.push({
      id: 'TSK-002',
      description: 'Tasks have unique IDs',
      passed: hasTaskIds,
      required: true
    });
    if (!hasTaskIds) {
      results.passed = false;
      results.failures.push('No task IDs found (expected Task 1.1, Task 1.2, etc.)');
    }

    // Check for requirement traceability
    const hasTraceability = /FR-\d+|NFR-\d+/i.test(content);
    results.criteria.push({
      id: 'TSK-003',
      description: 'Tasks trace to requirements',
      passed: hasTraceability,
      required: true
    });
    if (!hasTraceability) {
      results.passed = false;
      results.failures.push('Tasks do not reference requirements');
    }

    return results;
  }

  // ============================================================================
  // Phase 4: Research Validation
  // ============================================================================

  private async validateResearch(): Promise<ValidationResult> {
    const results: ValidationResult = {
      passed: true,
      phase: 4,
      criteria: [],
      failures: [],
      warnings: []
    };

    const docsPath = path.join(this.workspacePath, 'docs');
    const docsExist = await this.directoryExists(docsPath);

    results.criteria.push({
      id: 'RES-001',
      description: 'docs/ directory exists',
      passed: docsExist,
      required: true
    });

    if (!docsExist) {
      results.passed = false;
      results.failures.push('docs/ directory not found');
      return results;
    }

    // Check for at least one doc file
    const files = await this.getMarkdownFiles(docsPath);
    const hasDocFiles = files.length > 0;

    results.criteria.push({
      id: 'RES-002',
      description: 'At least one research document exists',
      passed: hasDocFiles,
      required: true
    });

    if (!hasDocFiles) {
      results.passed = false;
      results.failures.push('No research documents found in docs/');
    }

    return results;
  }

  // ============================================================================
  // Phase 5: Implementation Validation
  // ============================================================================

  private async validateImplementation(): Promise<ValidationResult> {
    const results: ValidationResult = {
      passed: true,
      phase: 5,
      criteria: [],
      failures: [],
      warnings: []
    };

    const srcPath = path.join(this.workspacePath, 'src');
    const srcExists = await this.directoryExists(srcPath);

    results.criteria.push({
      id: 'IMP-001',
      description: 'src/ directory exists',
      passed: srcExists,
      required: true
    });

    if (!srcExists) {
      results.passed = false;
      results.failures.push('src/ directory not found');
      return results;
    }

    // Check for source files
    const files = await this.getSourceFiles(srcPath);
    const hasSourceFiles = files.length > 0;

    results.criteria.push({
      id: 'IMP-002',
      description: 'Source files exist',
      passed: hasSourceFiles,
      required: true
    });

    if (!hasSourceFiles) {
      results.passed = false;
      results.failures.push('No source files found in src/');
    }

    // Check implementation.md exists (optional)
    const implPath = path.join(this.workspacePath, '.spec', 'implementation.md');
    const implExists = await this.fileExists(implPath);

    results.criteria.push({
      id: 'IMP-003',
      description: 'implementation.md exists',
      passed: implExists,
      required: false
    });

    if (!implExists) {
      results.warnings.push('implementation.md not found (recommended for tracking)');
    }

    return results;
  }

  // ============================================================================
  // Phase 6: Validation Phase Validation
  // ============================================================================

  private async validateValidation(): Promise<ValidationResult> {
    const results: ValidationResult = {
      passed: true,
      phase: 6,
      criteria: [],
      failures: [],
      warnings: []
    };

    const validationPath = path.join(this.workspacePath, '.spec', 'validation.md');
    const fileExists = await this.fileExists(validationPath);

    results.criteria.push({
      id: 'VAL-001',
      description: 'validation.md exists',
      passed: fileExists,
      required: true
    });

    if (!fileExists) {
      results.passed = false;
      results.failures.push('validation.md not found in .spec/');
      return results;
    }

    const content = await fs.readFile(validationPath, 'utf-8');

    // Check for test results
    const hasTestResults = /test|pass|fail|✅|❌/i.test(content);
    results.criteria.push({
      id: 'VAL-002',
      description: 'Test results documented',
      passed: hasTestResults,
      required: true
    });

    if (!hasTestResults) {
      results.passed = false;
      results.failures.push('No test results found in validation.md');
    }

    // Check for acceptance criteria verification
    const hasAcceptanceVerification = /acceptance|criteria|verified|FR-\d+/i.test(content);
    results.criteria.push({
      id: 'VAL-003',
      description: 'Acceptance criteria verified',
      passed: hasAcceptanceVerification,
      required: true
    });

    if (!hasAcceptanceVerification) {
      results.passed = false;
      results.failures.push('Acceptance criteria not verified');
    }

    return results;
  }

  // ============================================================================
  // Phase 7: Deployment Validation
  // ============================================================================

  private async validateDeployment(): Promise<ValidationResult> {
    const results: ValidationResult = {
      passed: true,
      phase: 7,
      criteria: [],
      failures: [],
      warnings: []
    };

    const deployPath = path.join(this.workspacePath, '.deploy');
    const deployExists = await this.directoryExists(deployPath);

    results.criteria.push({
      id: 'DEP-001',
      description: '.deploy/ directory exists',
      passed: deployExists,
      required: true
    });

    if (!deployExists) {
      results.passed = false;
      results.failures.push('.deploy/ directory not found');
      return results;
    }

    // Check for deployment artifacts
    const files = await this.getFiles(deployPath);
    const hasDeployFiles = files.length > 0;

    results.criteria.push({
      id: 'DEP-002',
      description: 'Deployment artifacts exist',
      passed: hasDeployFiles,
      required: true
    });

    if (!hasDeployFiles) {
      results.passed = false;
      results.failures.push('No deployment artifacts found in .deploy/');
    }

    return results;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  private async getMarkdownFiles(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files: string[] = [];
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('_')) {
          files.push(entry.name);
        } else if (entry.isDirectory() && !entry.name.startsWith('_')) {
          const subFiles = await this.getMarkdownFiles(path.join(dirPath, entry.name));
          files.push(...subFiles.map(f => path.join(entry.name, f)));
        }
      }
      
      return files;
    } catch {
      return [];
    }
  }

  private async getSourceFiles(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files: string[] = [];
      const sourceExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.go', '.rs', '.java'];
      
      for (const entry of entries) {
        if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (sourceExtensions.includes(ext)) {
            files.push(entry.name);
          }
        } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const subFiles = await this.getSourceFiles(path.join(dirPath, entry.name));
          files.push(...subFiles.map(f => path.join(entry.name, f)));
        }
      }
      
      return files;
    } catch {
      return [];
    }
  }

  private async getFiles(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries
        .filter(e => e.isFile() && !e.name.startsWith('.'))
        .map(e => e.name);
    } catch {
      return [];
    }
  }
}

export default ValidationEngine;
