import path from 'node:path';

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Validates that a requested file path does not attempt path traversal
 * and resolves strictly inside the target directory.
 *
 * @param baseDir The root target directory where files should be written.
 * @param relativePath The relative path supplied by the component bundle.
 * @returns The canonical absolute destination file path.
 * @throws SecurityError if path traversal or an insecure destination is detected.
 */
export function validateAndResolvePath(baseDir: string, relativePath: string): string {
  if (!relativePath || typeof relativePath !== 'string') {
    throw new SecurityError('Invalid bundle file path: Path must be a non-empty string.');
  }

  // 1. Detect poison null bytes
  if (relativePath.includes('\0')) {
    throw new SecurityError(`Insecure path: File path "${relativePath}" contains illegal null bytes.`);
  }

  // 2. Reject absolute paths or Windows drive letters
  const trimmed = relativePath.trim();
  if (path.isAbsolute(trimmed) || /^[a-zA-Z]:[\\/]/.test(trimmed)) {
    throw new SecurityError(
      `Insecure path: Absolute file paths are not permitted in component bundles ("${relativePath}").`
    );
  }

  // 3. Resolve base directory and canonical destination
  const resolvedBase = path.resolve(baseDir);
  const resolvedDest = path.resolve(resolvedBase, trimmed);

  // 4. Verify destination is strictly within resolved base directory
  const baseWithSep = resolvedBase.endsWith(path.sep) ? resolvedBase : resolvedBase + path.sep;

  if (resolvedDest !== resolvedBase && !resolvedDest.startsWith(baseWithSep)) {
    throw new SecurityError(
      `Path traversal attack detected: "${relativePath}" resolves to "${resolvedDest}", which is outside the target directory "${resolvedBase}". Execution aborted.`
    );
  }

  return resolvedDest;
}
