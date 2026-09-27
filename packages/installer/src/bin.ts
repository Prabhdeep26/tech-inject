#!/usr/bin/env node

import { runCli } from './cli.js';

runCli().then((code) => {
  if (code !== 0) {
    process.exit(code);
  }
}).catch((err) => {
  console.error('Fatal CLI error:', err);
  process.exit(1);
});
