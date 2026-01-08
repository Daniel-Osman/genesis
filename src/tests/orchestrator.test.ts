/**
 * Genesis Framework - Orchestrator Tests
 * Phases A-D: Complete test coverage
 * @version 2.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { GenesisOrchestrator } from '../core/orchestrator';

describe('GenesisOrchestrator', () => {
  const testWorkspace = path.join(process.cwd(), 'test-workspace');
  let orchestrator: GenesisOrchestrator;

  beforeEach(async () => {
    // Create test workspace
    await fs.mkdir(testWorkspace, { recursive: true });
    await fs.mkdir(path.join(testWorkspace, '.genesis'), { recursive: true });
    await fs.mkdir(path.join(testWorkspace, '.genesis', 'prompts'), { recursive: true });
    await fs.mkdir(path.join(testWorkspace, '.spec'), { recursive: true });
    await fs.mkdir(path.join(testWorkspace, 'docs'), { recursive: true });
    await fs.mkdir(path.join(testWorkspace, 'src'), { recursive: true });
    await fs.mkdir(path.join(testWorkspace, '.deploy'), { recursive: true });

    // Create default status.json
    const defaultStatus = {
      project: { name: null, description: null, created: null, updated: null, version: '0.1.0' },
      phase: {
        current: 0,
        status: 'NOT_INITIALIZED',
        labels: {
          '0': 'Initialization', '1': 'Requirements', '2': 'Design', '3': 'Tasks',
          '4': 'Research', '5': 'Implementation', '6': 'Validation', '7': 'Deployment'
        }
      },
      session: { last_active: null, resume_point: null, last_action: null },
      agent: null,
      context: { prompt_lines: 0, artifacts_lines: 0, total_lines: 0, budget_lines: 2000 },
      gates: {
        gate_1_requirements: 'LOCKED', gate_2_design: 'LOCKED', gate_3_tasks: 'LOCKED',
        gate_4_research: 'LOCKED', gate_5_implementation: 'LOCKED',
        gate_6_validation: 'LOCKED', gate_7_deployment: 'LOCKED'
      },
      checkpoints: { pending: false, type: null, requested_at: null, context: null, validation_passed: false, history: [] },
      progress: {
        phase_1_complete: false, phase_2_complete: false, phase_3_complete: false,
        phase_4_complete: false, phase_5_complete: false, phase_6_complete: false, phase_7_complete: false
      },
      halted: false, halt_reason: null, halt_code: null,
      errors: { active: [], count: 0, fingerprints: {} },
      transitions: [],
      audit: [],
      iteration: { count: 0, max: 5, feedback: null },
      config: { max_retries: 3, max_iterations: 5, halt_codes: ['HALT-001', 'HALT-002', 'HALT-003', 'HALT-004', 'HALT-005'] }
    };

    await fs.writeFile(
      path.join(testWorkspace, '.genesis', 'status.json'),
      JSON.stringify(defaultStatus, null, 2)
    );

    // Create a mock agent prompt
    await fs.writeFile(
      path.join(testWorkspace, '.genesis', 'prompts', 'product_owner.md'),
      '# Product Owner\n\nAgent prompt for Phase 1.\n\n## Role\nGather requirements.'
    );

    orchestrator = new GenesisOrchestrator(testWorkspace);
  });

  afterEach(async () => {
    await fs.rm(testWorkspace, { recursive: true, force: true });
  });

  // ==========================================================================
  // Phase A: Core Workflow Tests
  // ==========================================================================

  describe('STATUS command', () => {
    it('should return current status', async () => {
      const result = await orchestrator.execute({ type: 'STATUS' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('GENESIS STATUS');
      expect(result.message).toContain('Not initialized');
    });
  });

  describe('INIT command', () => {
    it('should initialize a new project and await approval', async () => {
      const result = await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('Test Project');
      expect(result.message).toContain('AWAITING APPROVAL');
      expect(result.awaiting_approval).toBe(true);
    });

    it('should reject initialization if already initialized', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      
      const result = await orchestrator.execute({ type: 'INIT', name: 'Another Project' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('already initialized');
    });
  });

  describe('VALIDATE command', () => {
    it('should validate current phase', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });

      const result = await orchestrator.execute({ type: 'VALIDATE' });
      expect(result.success).toBeDefined();
      expect(result.message).toContain('VALIDATION');
    });

    it('should fail validation when requirements.md is missing', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });

      const result = await orchestrator.execute({ type: 'VALIDATE' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('requirements.md');
    });
  });

  describe('CHECKPOINT command', () => {
    it('should request checkpoint after initialization', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });

      const result = await orchestrator.execute({ type: 'CHECKPOINT' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('CHECKPOINT REQUESTED');
      expect(result.awaiting_approval).toBe(true);
    });

    it('should not allow duplicate checkpoints', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      await orchestrator.execute({ type: 'CHECKPOINT' });

      const result = await orchestrator.execute({ type: 'CHECKPOINT' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('already pending');
    });
  });

  describe('HALT and RESUME commands', () => {
    it('should halt the system', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });

      const result = await orchestrator.execute({ 
        type: 'HALT', 
        code: 'HALT-001', 
        reason: 'Test halt' 
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('HALTED');
    });

    it('should block commands when halted', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      await orchestrator.execute({ type: 'HALT', code: 'HALT-001', reason: 'Test halt' });

      const result = await orchestrator.execute({ type: 'VALIDATE' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('halted');
    });

    it('should resume from halt with justification', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      await orchestrator.execute({ type: 'HALT', code: 'HALT-001', reason: 'Test halt' });

      const result = await orchestrator.execute({ 
        type: 'RESUME', 
        justification: 'Issue resolved' 
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('RESUMED');
    });
  });

  describe('ITERATE command', () => {
    it('should apply iteration feedback', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });

      const result = await orchestrator.execute({ 
        type: 'ITERATE', 
        feedback: 'Add more detail' 
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Iteration');
    });

    it('should track iteration count', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });

      await orchestrator.execute({ type: 'ITERATE', feedback: 'First' });
      const result = await orchestrator.execute({ type: 'ITERATE', feedback: 'Second' });

      expect(result.message).toContain('2/5');
    });
  });

  describe('APPROVE/REJECT/SKIP commands', () => {
    it('should approve pending checkpoint and advance', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      
      const result = await orchestrator.execute({ type: 'APPROVE' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('APPROVED');
      expect(result.message).toContain('Phase 1');
    });

    it('should reject pending checkpoint with feedback', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      
      const result = await orchestrator.execute({ 
        type: 'REJECT', 
        feedback: 'Need more detail' 
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('REJECTED');
    });

    it('should skip with reason and advance', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      await orchestrator.execute({ type: 'CHECKPOINT' });

      const result = await orchestrator.execute({ 
        type: 'SKIP', 
        reason: 'MVP scope' 
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('SKIPPED');
    });
  });

  describe('UNDO command', () => {
    it('should return to previous phase', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      await orchestrator.execute({ type: 'CHECKPOINT' });
      await orchestrator.execute({ type: 'APPROVE' });

      const result = await orchestrator.execute({ type: 'UNDO' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('UNDO');
    });
  });

  describe('ROLLBACK command', () => {
    it('should rollback to earlier phase', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      await orchestrator.execute({ type: 'CHECKPOINT' });
      await orchestrator.execute({ type: 'APPROVE' });
      await orchestrator.execute({ type: 'CHECKPOINT' });
      await orchestrator.execute({ type: 'APPROVE' });

      const result = await orchestrator.execute({ type: 'ROLLBACK', phase: 1 });

      expect(result.success).toBe(true);
      expect(result.message).toContain('ROLLBACK');
    });

    it('should reject forward rollback', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });

      const result = await orchestrator.execute({ type: 'ROLLBACK', phase: 3 });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot rollback forward');
    });
  });

  // ==========================================================================
  // Phase B: Context Optimization Tests
  // ==========================================================================

  describe('LOAD_AGENT command', () => {
    it('should load agent context for phase', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });

      const result = await orchestrator.execute({ type: 'LOAD_AGENT', phase: 1 });

      expect(result.success).toBe(true);
      expect(result.message).toContain('product_owner');
      expect(result.message).toContain('CONTEXT BUDGET');
    });
  });

  describe('LOAD_ARTIFACT command', () => {
    it('should load artifact into context', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });

      // Create a test artifact
      await fs.writeFile(
        path.join(testWorkspace, '.spec', 'requirements.md'),
        '# Requirements\n\n## FR-1: Test Feature\n\nAcceptance criteria here.'
      );

      const result = await orchestrator.execute({ 
        type: 'LOAD_ARTIFACT', 
        path: '.spec/requirements.md' 
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('ARTIFACT LOADED');
      expect(result.message).toContain('CONTEXT BUDGET');
    });

    it('should fail for non-existent artifact', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });

      const result = await orchestrator.execute({ 
        type: 'LOAD_ARTIFACT', 
        path: '.spec/nonexistent.md' 
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('CONTEXT_STATUS command', () => {
    it('should show context budget status', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });

      const result = await orchestrator.execute({ type: 'CONTEXT_STATUS' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('CONTEXT STATUS');
      expect(result.message).toContain('CONTEXT BUDGET');
    });
  });

  describe('RESET_CONTEXT command', () => {
    it('should reset context', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      await orchestrator.execute({ type: 'LOAD_AGENT', phase: 1 });

      const result = await orchestrator.execute({ type: 'RESET_CONTEXT' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Context reset');
    });
  });

  // ==========================================================================
  // Phase C: Human Control Enhancement Tests
  // ==========================================================================

  describe('FORCE command', () => {
    it('should log forced action in audit trail', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });

      const result = await orchestrator.execute({ 
        type: 'FORCE', 
        action: 'Skip validation', 
        reason: 'Emergency deployment' 
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('FORCE ACTION LOGGED');
    });
  });

  describe('OVERRIDE command', () => {
    it('should override gate status', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });

      const result = await orchestrator.execute({ 
        type: 'OVERRIDE', 
        gate: 'gate_1_requirements', 
        reason: 'Manual verification complete' 
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('GATE OVERRIDE');
    });

    it('should fail for invalid gate', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });

      const result = await orchestrator.execute({ 
        type: 'OVERRIDE', 
        gate: 'invalid_gate', 
        reason: 'Test' 
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown gate');
    });
  });

  describe('HISTORY command', () => {
    it('should show audit history', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });

      const result = await orchestrator.execute({ type: 'HISTORY' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('AUDIT HISTORY');
      expect(result.message).toContain('CHECKPOINT HISTORY');
      expect(result.message).toContain('PHASE TRANSITIONS');
    });
  });
});
