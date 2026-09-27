import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {
  validateAndResolvePath,
  SecurityError,
  installComponent,
  OverwriteError,
  parseArgs,
  runCli,
} from '../src/index.js';

test('Tech-Inject Installer & CLI Suite', async (t) => {
  // Temporary sandbox directory for test runs
  const testSandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'tech-inject-installer-test-'));

  t.after(() => {
    fs.rmSync(testSandbox, { recursive: true, force: true });
  });

  // 1. PATH TRAVERSAL PROTECTION TESTS
  await t.test('1. Path Traversal Protection: strictly refuses paths escaping targetDir', () => {
    const targetDir = path.join(testSandbox, 'safe-components');

    // Should resolve safely within targetDir
    const safePath = validateAndResolvePath(targetDir, 'Button/index.tsx');
    assert.equal(safePath, path.join(targetDir, 'Button', 'index.tsx'));

    // Should reject ../ traversal
    assert.throws(
      () => validateAndResolvePath(targetDir, '../escape.js'),
      SecurityError,
      'Should throw SecurityError for ../ traversal'
    );

    // Should reject nested ../../ traversal
    assert.throws(
      () => validateAndResolvePath(targetDir, 'nested/../../outside.js'),
      SecurityError,
      'Should throw SecurityError for nested traversal'
    );

    // Should reject poison null byte
    assert.throws(
      () => validateAndResolvePath(targetDir, 'valid.tsx\0malicious.bat'),
      SecurityError,
      'Should throw SecurityError for null bytes'
    );

    // Should reject absolute paths
    const absolutePath = path.resolve('/etc/passwd');
    assert.throws(
      () => validateAndResolvePath(targetDir, absolutePath),
      SecurityError,
      'Should throw SecurityError for absolute paths'
    );
  });

  // 2. OVERWRITE PROTECTION & ZERO EXECUTION TESTS
  await t.test('2. Overwrite Protection: refuses to silently overwrite existing files without --force', async () => {
    const targetDir = path.join(testSandbox, 'overwrite-test');
    fs.mkdirSync(targetDir, { recursive: true });

    const existingFilePath = path.join(targetDir, 'ActionButton.tsx');
    fs.writeFileSync(existingFilePath, '// Original untouched user content', 'utf-8');

    // Setup mock server
    const server = http.createServer((req, res) => {
      if (req.url?.includes('/components/action-button/source')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'success',
            data: {
              slug: 'action-button',
              files: [
                {
                  path: 'ActionButton.tsx',
                  content: '// New bundle content from registry',
                },
              ],
            },
          })
        );
        return;
      }
      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;
    const apiUrl = `http://127.0.0.1:${port}`;

    try {
      // Attempt 1: Without force -> must refuse to overwrite and throw OverwriteError
      await assert.rejects(
        () =>
          installComponent({
            slug: 'action-button',
            targetDir,
            apiUrl,
            force: false,
          }),
        OverwriteError
      );

      // Verify original content was NOT modified
      const currentContent = fs.readFileSync(existingFilePath, 'utf-8');
      assert.equal(currentContent, '// Original untouched user content');

      // Attempt 2: With force: true -> safely overwrites
      const result = await installComponent({
        slug: 'action-button',
        targetDir,
        apiUrl,
        force: true,
      });

      assert.equal(result.success, true);
      assert.equal(result.writtenFiles.length, 1);
      const updatedContent = fs.readFileSync(existingFilePath, 'utf-8');
      assert.equal(updatedContent, '// New bundle content from registry');
    } finally {
      server.close();
    }
  });

  // 3. AUTHENTICATION & TOKEN HANDLING
  await t.test('3. API Authentication: passes user token and rejects missing auth on protected components', async () => {
    let capturedAuthHeader: string | undefined;

    const server = http.createServer((req, res) => {
      capturedAuthHeader = req.headers['authorization'];

      // If premium component requested without token -> 401
      if (req.url?.includes('premium-grid') && !capturedAuthHeader) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'error',
            message: 'Authentication required. Please log in.',
          })
        );
        return;
      }

      // If token provided -> 200 success
      if (req.url?.includes('premium-grid') && capturedAuthHeader === 'Bearer user_valid_secret_token') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'success',
            data: {
              slug: 'premium-grid',
              files: [
                {
                  path: 'Grid.tsx',
                  content: 'export const Grid = () => <div>Grid</div>;',
                },
              ],
            },
          })
        );
        return;
      }

      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: 'Access denied: Premium tier required.' }));
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;
    const apiUrl = `http://127.0.0.1:${port}`;

    try {
      const targetDir = path.join(testSandbox, 'auth-test');

      // 1. Unauthenticated request to premium component fails with 401 message
      await assert.rejects(
        () =>
          installComponent({
            slug: 'premium-grid',
            targetDir,
            apiUrl,
          }),
        /Authentication required/
      );

      // 2. Authenticated request passing token succeeds
      const result = await installComponent({
        slug: 'premium-grid',
        targetDir,
        apiUrl,
        token: 'user_valid_secret_token',
      });

      assert.equal(result.success, true);
      assert.equal(capturedAuthHeader, 'Bearer user_valid_secret_token');
      assert.ok(fs.existsSync(path.join(targetDir, 'Grid.tsx')));
    } finally {
      server.close();
    }
  });

  // 4. MALICIOUS BUNDLE PATH TRAVERSAL REJECTION
  await t.test('4. Security: refuses bundle attempting path traversal even if server returns it', async () => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'success',
          data: {
            slug: 'malicious-component',
            files: [
              {
                path: '../../evil-file.js',
                content: 'console.log("escaped");',
              },
            ],
          },
        })
      );
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;
    const apiUrl = `http://127.0.0.1:${port}`;

    try {
      const targetDir = path.join(testSandbox, 'safe-zone');

      await assert.rejects(
        () =>
          installComponent({
            slug: 'malicious-component',
            targetDir,
            apiUrl,
          }),
        SecurityError
      );

      // Confirm malicious file was NEVER created outside safe-zone
      const outsideFile = path.resolve(targetDir, '../../evil-file.js');
      assert.equal(fs.existsSync(outsideFile), false);
    } finally {
      server.close();
    }
  });

  // 5. CLI ARGUMENT PARSER TESTS
  await t.test('5. CLI Argument Parsing: supports options, flags, and slugs', () => {
    const parsed1 = parseArgs(['action-button', './src/ui', '--force', '--dry-run']);
    assert.equal(parsed1.slug, 'action-button');
    assert.equal(parsed1.targetDir, './src/ui');
    assert.equal(parsed1.force, true);
    assert.equal(parsed1.dryRun, true);

    const parsed2 = parseArgs(['add', 'telemetry-chart', '-t', 'my_token', '-u', 'http://my-api.com']);
    assert.equal(parsed2.slug, 'telemetry-chart');
    assert.equal(parsed2.token, 'my_token');
    assert.equal(parsed2.apiUrl, 'http://my-api.com');

    const parsed3 = parseArgs(['--help']);
    assert.equal(parsed3.help, true);
  });

  // 6. CLI RUNNER END-TO-END TEST
  await t.test('6. CLI Runner E2E: executes dry-run and help cleanly', async () => {
    const codeHelp = await runCli(['--help']);
    assert.equal(codeHelp, 0);

    const codeVersion = await runCli(['--version']);
    assert.equal(codeVersion, 0);

    const codeMissingSlug = await runCli([]);
    assert.equal(codeMissingSlug, 1);
  });
});
