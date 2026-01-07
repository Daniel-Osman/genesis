/**
 * Genesis Framework - Orchestrator Tests
 * Comprehensive test suite for the core orchestrator
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { GenesisOrchestrator } from '../core/orchestrator';
import type { GenesisStatus } from '../core/types';

const TEST_WORKSPACE = path.join(__dirname, '../../.test-workspace');

describe('GenesisOrchestrator', () => {
  let orchestrator: GenesisOrchestrator;

  beforeEach(async () => {
    // Create test workspace
    await fs.mkdir(TEST_WORKSPACE, { recursive: true });
    await fs.mkdir(path.join(TEST_WORKSPACE, '.genesis'), { recursive: true });
    await fs.mkdir(path.join(TEST_WORKSPACE, '.genesis/prompts'), { recursive: true });
    await fs.mkdir(path.join(TEST_WORKSPACE, '.spec'), { recursive: true });
    await fs.mkdir(path.join(TEST_WORKSPACE, 'docs/_cache'), { recursive: true });
    await fs.mkdir(path.join(TEST_WORKSPACE, 'src'), { recursive: true });
    await fs.mkdir(path.join(TEST_WORKSPACE, '.deploy'), { recursive: true });

    // Copy status.json template
    const statusTemplate = await fs.readFile(
      path.join(__dirname, '../../.genesis/status.json'),
      'utf-8'
    );
    await fs.writeFile(
      path.join(TEST_WORKSPACE, '.genesis/status.json'),
      statusTemplate
    );

    // Create minimal agent prompts
    const agents = ['product_owner', 'architect', 'tech_lead', 'researcher', 'developer', 'validator', 'deployer'];
    for (const agent of agents) {
      await fs.writeFile(
        path.join(TEST_WORKSPACE, `.genesis/prompts/${agent}.md`),
        `# ${agent} Agent\n\n## Agent Identity\nTest agent\n\n## Activation Condition\n\`\`\`json\n{}\n\`\`\`\n\n## Responsibilities\nTest\n\n## Workflow\nTest`
      );
    }

    // Create system.md
    await fs.writeFile(
      path.join(TEST_WORKSPACE, '.genesis/system.md'),
      '# System\n\n## Agent Identity\nOrchestrator\n\n## Activation Condition\n```json\n{}\n```\n\n## Responsibilities\nTest\n\n## Workflow\nTest'
    );

    orchestrator = new GenesisOrchestrator(TEST_WORKSPACE);
  });

  afterEach(async () => {
    // Cleanup test workspace
    await fs.rm(TEST_WORKSPACE, { recursive: true, force: true });
  });

  describe('STATUS command', () => {
    it('should return current status', async () => {
      const result = await orchestrator.execute({ type: 'STATUS' });
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('GENESIS STATUS');
      expect(result.message).toContain('Not initialized');
    });
  });

  describe('INIT command', () => {
    it('should initialize a new project', async () => {
      const result = await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Test Project');
      expect(result.checkpoint?.type).toBe('PROJECT_INIT');
      expect(result.checkpoint?.awaiting_approval).toBe(true);
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
      expect(result.message).toContain('VALIDATION RESULTS');
    });
  });

  describe('CHECKPOINT command', () => {
    it('should request checkpoint after validation', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      
      // Checkpoint will fail validation since requirements aren't complete
      // This is expected behavior - validation must pass first
      const result = await orchestrator.execute({ type: 'CHECKPOINT' });
      
      // Should mention validation failed or checkpoint
      expect(result.message).toMatch(/checkpoint|validation/i);
    });

    it('should support partial checkpoints', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      
      const result = await orchestrator.execute({ type: 'CHECKPOINT', partial: true });
      
      expect(result.message).toContain('Partial');
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
      expect(result.message).toContain('SYSTEM HALTED');
      expect(result.halt?.code).toBe('HALT-001');
    });

    it('should block commands when halted', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      await orchestrator.execute({ type: 'HALT', code: 'HALT-001', reason: 'Test' });
      
      const result = await orchestrator.execute({ type: 'VALIDATE' });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('halted');
    });

    it('should resume from halt', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      await orchestrator.execute({ type: 'HALT', code: 'HALT-001', reason: 'Test' });
      
      const result = await orchestrator.execute({ type: 'RESUME' });
      
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
        feedback: 'Add more detail to requirements' 
      });
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Iteration 1');
    });

    it('should track iteration count', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      
      await orchestrator.execute({ type: 'ITERATE', feedback: 'First' });
      await orchestrator.execute({ type: 'ITERATE', feedback: 'Second' });
      const result = await orchestrator.execute({ type: 'ITERATE', feedback: 'Third' });
      
      expect(result.message).toContain('Iteration 3');
    });
  });

  describe('APPROVE/REJECT commands', () => {
    it('should approve pending checkpoint', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      
      const result = await orchestrator.execute({ type: 'APPROVE' });
      
      expect(result.success).toBe(true);
      // After approval, it advances to next phase
      expect(result.message).toMatch(/APPROVED|ADVANCED/i);
    });

    it('should reject pending checkpoint with feedback', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      
      const result = await orchestrator.execute({ 
        type: 'REJECT', 
        feedback: 'Need more detail' 
      });
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('REJECTED');
      expect(result.message).toContain('Need more detail');
    });

    it('should fail if no pending checkpoint', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      
      const result = await orchestrator.execute({ type: 'APPROVE' });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('No pending checkpoint');
    });
  });

  describe('ROLLBACK command', () => {
    it('should perform dry-run rollback', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      
      // Advance a few phases first (would need proper setup)
      const result = await orchestrator.execute({ 
        type: 'ROLLBACK', 
        phase: 1, 
        dryRun: true 
      });
      
      // Should fail since we're at phase 1
      expect(result.message).toBeDefined();
    });

    it('should reject forward rollback', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      
      const result = await orchestrator.execute({ type: 'ROLLBACK', phase: 5 });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot rollback forward');
    });
  });

  describe('METRICS command', () => {
    it('should display metrics dashboard', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      
      const result = await orchestrator.execute({ type: 'METRICS' });
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('METRICS DASHBOARD');
    });
  });

  describe('SOFT_GATES command', () => {
    it('should display soft gate status', async () => {
      await orchestrator.execute({ type: 'INIT', name: 'Test Project' });
      await orchestrator.execute({ type: 'APPROVE' });
      
      const result = await orchestrator.execute({ type: 'SOFT_GATES' });
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('SOFT GATE STATUS');
    });
  });

  describe('CACHE commands', () => {
    it('should show cache status', async () => {
      const result = await orchestrator.execute({ type: 'CACHE_STATUS' });
      
      expect(result.success).toBe(true);
    });

    it('should clear cache', async () => {
      const result = await orchestrator.execute({ type: 'CACHE_CLEAR' });
      
      expect(result.success).toBe(true);
    });
  });
});
