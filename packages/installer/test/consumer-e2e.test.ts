import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { runCli } from '../src/cli.js';

test('Consumer Project E2E Reproduction: installing component into empty React+TS project', async (t) => {
  // 1. Create a brand-new, empty consumer React+TS project sandbox
  const consumerRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tech-inject-consumer-app-'));
  const originalCwd = process.cwd();

  t.after(() => {
    process.chdir(originalCwd);
    fs.rmSync(consumerRoot, { recursive: true, force: true });
  });

  // Setup minimal React+TS consumer structure
  fs.mkdirSync(path.join(consumerRoot, 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(consumerRoot, 'package.json'),
    JSON.stringify(
      {
        name: 'my-consumer-app',
        private: true,
        version: '0.0.0',
        type: 'module',
        dependencies: {
          react: '^18.0.0',
        },
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(consumerRoot, 'src', 'App.tsx'),
    `import React from 'react';\nexport function App() { return <div>Consumer App</div>; }\n`
  );

  // 2. Start mock deployed API server hosting component bundle
  const server = http.createServer((req, res) => {
    if (req.url === '/components/action-button/source') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'success',
          data: {
            slug: 'action-button',
            version: '1.0.0',
            entryPoint: 'ActionButton.tsx',
            files: [
              {
                path: 'ActionButton.tsx',
                content: `import React from 'react';\nexport interface ActionButtonProps { label: string; onClick?: () => void; }\nexport const ActionButton: React.FC<ActionButtonProps> = ({ label, onClick }) => <button onClick={onClick}>{label}</button>;\n`,
              },
              {
                path: 'ActionButton.css',
                content: `.action-button { background-color: #00B562; color: #fff; padding: 8px 16px; border-radius: 6px; }`,
              },
            ],
          },
        })
      );
      return;
    }

    if (req.url === '/components/premium-badge/source') {
      const auth = req.headers['authorization'];
      if (!auth || auth !== 'Bearer valid_customer_token') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Authentication required. Please log in.' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'success',
          data: {
            slug: 'premium-badge',
            files: [
              {
                path: 'Badge.tsx',
                content: `import React from 'react';\nexport const Badge = () => <span>★ Premium</span>;\n`,
              },
            ],
          },
        })
      );
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'error', message: 'Component not found' }));
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const apiUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  // Switch working directory to consumer app root
  process.chdir(consumerRoot);

  await t.test('Step A: Installs free component into ./src/components/ui', async () => {
    const exitCode = await runCli([
      'action-button',
      './src/components/ui',
      '--api-url',
      apiUrl,
    ]);

    assert.equal(exitCode, 0, 'CLI should exit with code 0 on successful installation');

    const buttonPath = path.join(consumerRoot, 'src', 'components', 'ui', 'ActionButton.tsx');
    const cssPath = path.join(consumerRoot, 'src', 'components', 'ui', 'ActionButton.css');

    assert.ok(fs.existsSync(buttonPath), 'ActionButton.tsx should be created in consumer app');
    assert.ok(fs.existsSync(cssPath), 'ActionButton.css should be created in consumer app');

    const content = fs.readFileSync(buttonPath, 'utf-8');
    assert.match(content, /export const ActionButton/);
  });

  await t.test('Step B: Refuses to overwrite existing file without --force', async () => {
    // Attempting to install again without --force must fail with code 2 (OverwriteError)
    const exitCode = await runCli([
      'action-button',
      './src/components/ui',
      '--api-url',
      apiUrl,
    ]);

    assert.equal(exitCode, 2, 'CLI should refuse to overwrite and exit with code 2');
  });

  await t.test('Step C: Overwrites existing file when --force is supplied', async () => {
    // Attempting with --force must succeed
    const exitCode = await runCli([
      'action-button',
      './src/components/ui',
      '--api-url',
      apiUrl,
      '--force',
    ]);

    assert.equal(exitCode, 0, 'CLI should succeed when --force is passed');
  });

  await t.test('Step D: Installs protected component passing token', async () => {
    // Without token -> fails with code 1 (Auth required)
    const unauthCode = await runCli([
      'premium-badge',
      './src/components/ui',
      '--api-url',
      apiUrl,
    ]);
    assert.equal(unauthCode, 1, 'Should fail without authentication token');

    // With token -> succeeds with code 0
    const authCode = await runCli([
      'premium-badge',
      './src/components/ui',
      '--api-url',
      apiUrl,
      '--token',
      'valid_customer_token',
    ]);
    assert.equal(authCode, 0, 'Should succeed when token is supplied');

    const badgePath = path.join(consumerRoot, 'src', 'components', 'ui', 'Badge.tsx');
    assert.ok(fs.existsSync(badgePath), 'Badge.tsx should be installed');
  });
});
