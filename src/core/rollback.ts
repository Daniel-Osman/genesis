/**
 * Genesis Framework - Rollback Manager
 * Handles safe rollback operations with verification
 * @version 1.0.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import type { Phase } from './types';

export interface RollbackImpact {
  files: string[];
  progressReset: string[];
  archivePath: string;
  estimatedSize: number;
}

export interface ArchiveManifest {
  archive_id: string;
  created_at: string;
  source_phase: Phase;
  target_phase: Phase;
  reason: string;
  files: Array<{
    path: string;
    checksum: string;
    size_bytes: number;
    verified: boolean;
  }>;
  verification: {
    status: 'passed' | 'failed';
    verified_at: string;
    file_count: number;
    total_size_bytes: number;
  };
}

export class RollbackManager {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  async calculateImpact(fromPhase: Phase, toPhase: Phase): Promise<RollbackImpact> {
    const files: string[] = [];
    const progressReset: string[] = [];

    // Determine which artifacts to archive based on target phase
    const artifactsByPhase: Record<number, string[]> = {
      2: ['.spec/design.md'],
      3: ['.spec/tasks.md'],
      4: ['docs/'],
      5: ['src/', '.spec/implementation.md'],
      6: ['.spec/validation.md'],
      7: ['.deploy/']
    };

    // Collect files from phases after target
    for (let p = toPhase + 1; p <= fromPhase; p++) {
      const artifacts = artifactsByPhase[p] || [];
      for (const artifact of artifacts) {
        const fullPath = path.join(this.workspacePath, artifact);
        try {
          const stat = await fs.stat(fullPath);
          if (stat.isDirectory()) {
            const dirFiles = await this.getFilesRecursive(fullPath);
            files.push(...dirFiles.map(f => path.relative(this.workspacePath, f)));
          } else {
            files.push(artifact);
          }
        } catch {
          // File doesn't exist, skip
        }
      }

      // Track progress to reset
      progressReset.push(`Phase ${p}: Reset to initial state`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archivePath = `.genesis/archive/${timestamp}/`;

    return {
      files,
      progressReset,
      archivePath,
      estimatedSize: files.length * 1024 // Rough estimate
    };
  }

  private async getFilesRecursive(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          // Skip _cache directory
          if (entry.name !== '_cache') {
            files.push(...await this.getFilesRecursive(fullPath));
          }
        } else {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return files;
  }

  async execute(fromPhase: Phase, toPhase: Phase): Promise<ArchiveManifest> {
    const impact = await this.calculateImpact(fromPhase, toPhase);
    const archiveDir = path.join(this.workspacePath, impact.archivePath);

    // Create archive directory
    await fs.mkdir(archiveDir, { recursive: true });

    const manifest: ArchiveManifest = {
      archive_id: path.basename(archiveDir),
      created_at: new Date().toISOString(),
      source_phase: fromPhase,
      target_phase: toPhase,
      reason: `Rollback from Phase ${fromPhase} to Phase ${toPhase}`,
      files: [],
      verification: {
        status: 'passed',
        verified_at: '',
        file_count: 0,
        total_size_bytes: 0
      }
    };

    // Archive each file
    for (const file of impact.files) {
      const sourcePath = path.join(this.workspacePath, file);
      const destPath = path.join(archiveDir, file);

      try {
        // Ensure destination directory exists
        await fs.mkdir(path.dirname(destPath), { recursive: true });

        // Read file content
        const content = await fs.readFile(sourcePath);
        const checksum = createHash('sha256').update(content).digest('hex');

        // Copy to archive
        await fs.writeFile(destPath, content);

        // Verify copy
        const verifyContent = await fs.readFile(destPath);
        const verifyChecksum = createHash('sha256').update(verifyContent).digest('hex');

        manifest.files.push({
          path: file,
          checksum,
          size_bytes: content.length,
          verified: checksum === verifyChecksum
        });

        manifest.verification.total_size_bytes += content.length;

        // Remove original (except for directories we want to keep)
        if (!file.startsWith('docs/_cache')) {
          await fs.unlink(sourcePath);
        }
      } catch (error) {
        console.error(`Failed to archive ${file}:`, error);
      }
    }

    // Update verification
    manifest.verification.verified_at = new Date().toISOString();
    manifest.verification.file_count = manifest.files.length;
    manifest.verification.status = manifest.files.every(f => f.verified) ? 'passed' : 'failed';

    // Write manifest
    await fs.writeFile(
      path.join(archiveDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    return manifest;
  }

  async verifyArchive(archivePath: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const manifestPath = path.join(this.workspacePath, archivePath, 'manifest.json');

    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest: ArchiveManifest = JSON.parse(manifestContent);

      for (const file of manifest.files) {
        const filePath = path.join(this.workspacePath, archivePath, file.path);
        
        try {
          const content = await fs.readFile(filePath);
          const checksum = createHash('sha256').update(content).digest('hex');

          if (checksum !== file.checksum) {
            errors.push(`Checksum mismatch: ${file.path}`);
          }
        } catch {
          errors.push(`File missing: ${file.path}`);
        }
      }
    } catch {
      errors.push('Manifest not found or invalid');
    }

    return { valid: errors.length === 0, errors };
  }

  async listArchives(): Promise<string[]> {
    const archiveDir = path.join(this.workspacePath, '.genesis', 'archive');
    
    try {
      const entries = await fs.readdir(archiveDir, { withFileTypes: true });
      return entries
        .filter(e => e.isDirectory() && e.name !== '.gitkeep')
        .map(e => e.name)
        .sort()
        .reverse(); // Most recent first
    } catch {
      return [];
    }
  }
}

export default RollbackManager;
