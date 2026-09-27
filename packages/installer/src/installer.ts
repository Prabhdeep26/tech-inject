import fs from 'node:fs';
import path from 'node:path';
import type { InstallOptions, InstallResult } from './types.js';
import { validateAndResolvePath } from './validator.js';
import { fetchComponentBundle } from './client.js';

export class OverwriteError extends Error {
  public readonly existingFile: string;
  constructor(filePath: string) {
    super(
      `Refusing to overwrite existing file: "${filePath}". Pass --force or -f to overwrite existing files.`
    );
    this.name = 'OverwriteError';
    this.existingFile = filePath;
  }
}

/**
 * Installs a component bundle into the specified target directory.
 *
 * Guarantees:
 * - Path traversal protection: rejects any file attempting to write outside targetDir.
 * - Overwrite protection: refuses to silently overwrite existing files without explicit --force.
 * - Zero execution: never executes shell commands or lifecycle scripts.
 */
export async function installComponent(options: InstallOptions): Promise<InstallResult> {
  const { slug, targetDir, apiUrl, token, force = false, dryRun = false } = options;

  if (!slug || typeof slug !== 'string' || !slug.trim()) {
    throw new Error('A component slug is required (e.g. "action-button").');
  }

  if (!targetDir || typeof targetDir !== 'string' || !targetDir.trim()) {
    throw new Error('A target directory is required (e.g. "./src/components/ui").');
  }

  // 1. Fetch bundle from API
  const bundle = await fetchComponentBundle(slug, { apiUrl, token });

  // 2. Validate all destination paths and check for overwrite collisions BEFORE writing anything
  const validatedOperations: Array<{
    relativePath: string;
    destinationPath: string;
    content: string;
  }> = [];

  const existingFiles: string[] = [];

  for (const file of bundle.files) {
    // Path traversal check
    const destinationPath = validateAndResolvePath(targetDir, file.path);

    // Overwrite check
    if (fs.existsSync(destinationPath)) {
      existingFiles.push(destinationPath);
    }

    validatedOperations.push({
      relativePath: file.path,
      destinationPath,
      content: file.content,
    });
  }

  // If any file already exists and --force is not specified, refuse to overwrite
  if (existingFiles.length > 0 && !force) {
    throw new OverwriteError(existingFiles[0]);
  }

  // 3. If dry-run, return list of files that would be written
  if (dryRun) {
    return {
      success: true,
      slug: bundle.slug,
      targetDir: path.resolve(targetDir),
      writtenFiles: validatedOperations.map((op) => op.destinationPath),
    };
  }

  // 4. Safely write files to disk
  // NOTE: Zero shell command execution is invoked here or anywhere in this package.
  const writtenFiles: string[] = [];

  for (const op of validatedOperations) {
    const dir = path.dirname(op.destinationPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(op.destinationPath, op.content, 'utf-8');
    writtenFiles.push(op.destinationPath);
  }

  return {
    success: true,
    slug: bundle.slug,
    version: bundle.version,
    targetDir: path.resolve(targetDir),
    writtenFiles,
  };
}
