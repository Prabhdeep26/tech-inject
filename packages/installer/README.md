# @tech-inject/installer

Secure, zero-execution component installer and bundle extraction CLI for the Tech-Inject catalogue.

---

## Overview

`@tech-inject/installer` lets you install shared React + TypeScript components from a deployed Tech-Inject API directly into your local codebase (similar to shadcn/ui).

### Key Security & Design Guarantees:
- **Zero Execution**: Never runs shell scripts, `eval()`, or lifecycle hooks from component bundles.
- **Path Traversal Protection**: Refuses to write files outside your designated target directory (e.g. rejects `../`, absolute paths, and null bytes).
- **Overwrite Protection**: Refuses to silently overwrite existing files without explicit `--force`.
- **No Hardcoded Credentials**: API tokens are passed dynamically via flags or environment variables, never stored or embedded in code.

---

## Step-by-Step: From an Empty React + TS Project

Follow these exact steps to create a brand-new React + TypeScript application and install a component using `npx`.

### 1. Scaffold a New React + TypeScript Project

In your terminal, navigate to your workspace and initialize a new Vite project:

```bash
# Initialize a brand-new React + TypeScript project
npm create vite@latest my-consumer-app -- --template react-ts

# Enter the project directory
cd my-consumer-app

# Install dependencies
npm install
```

---

### 2. Run the Installer via `npx`

From the root of `my-consumer-app`, run the `@tech-inject/installer` CLI using `npx`:

#### For Free Public Components:
```bash
# Basic installation (defaults destination to ./src/components/ui)
npx @tech-inject/installer action-button

# Specifying a custom destination folder and API URL:
npx @tech-inject/installer action-button ./src/components/ui --api-url https://api.tech-inject.dev
```

#### For Protected / Premium Components:
Pass your API session token via `--token` or the `TECH_INJECT_TOKEN` environment variable:

```bash
# Option A: Passing token via flag
npx @tech-inject/installer pro-data-grid ./src/components/ui \
  --api-url https://api.tech-inject.dev \
  --token <YOUR_CUSTOMER_TOKEN>

# Option B: Setting the environment variable
export TECH_INJECT_TOKEN="<YOUR_CUSTOMER_TOKEN>"
npx @tech-inject/installer pro-data-grid ./src/components/ui --api-url https://api.tech-inject.dev
```

---

### 3. Verify the Installed Files

The installer will output a manifest of the written files:

```text
[tech-inject] Fetching component "action-button"...

✓ Successfully installed "action-button" into "src/components/ui":
  + src/components/ui/ActionButton.tsx
  + src/components/ui/ActionButton.module.css
```

---

### 4. Import & Use in Your Application

Open `src/App.tsx` and import the newly installed component:

```tsx
import React from 'react';
import { ActionButton } from './components/ui/ActionButton';

export function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>My Consumer App</h1>
      <p>Component installed via Tech-Inject CLI:</p>

      <ActionButton
        variant="primary"
        onClick={() => alert('Component loaded successfully!')}
      >
        Click Me
      </ActionButton>
    </div>
  );
}

export default App;
```

Start the Vite development server:
```bash
npm run dev
```

---

## CLI Command Reference

```text
USAGE:
  $ npx @tech-inject/installer <slug> [target-directory] [options]
  $ tech-inject add <slug> [target-directory] [options]

ARGUMENTS:
  <slug>                The component slug (e.g. "action-button" or "@tech-inject/action-button")
  [target-directory]    Destination folder (default: "./src/components/ui")

OPTIONS:
  -t, --token <token>   API Bearer token for premium or protected components (or set TECH_INJECT_TOKEN)
  -u, --api-url <url>   Tech-Inject API base URL (default: process.env.TECH_INJECT_API_URL or http://localhost:3000)
  -f, --force           Overwrite existing destination files if they already exist
      --dry-run         Simulate installation without writing any files to disk
  -h, --help            Show usage documentation
  -v, --version         Print CLI version
```

---

## Advanced Options & Edge Cases

### Overwrite Protection
If a component has already been installed or customized locally:
```bash
$ npx @tech-inject/installer action-button ./src/components/ui
✖ Refusing to overwrite existing file: ".../src/components/ui/ActionButton.tsx". Pass --force or -f to overwrite existing files.
```
To intentionally overwrite local modifications with the registry version:
```bash
npx @tech-inject/installer action-button ./src/components/ui --force
```

### Dry Run Simulation
To preview what files will be created without touching the disk:
```bash
npx @tech-inject/installer action-button ./src/components/ui --dry-run
```
Output:
```text
[tech-inject] Fetching component "action-button"...

[tech-inject] [DRY RUN] Would install 2 file(s) into ".../src/components/ui":
  + src/components/ui/ActionButton.tsx
  + src/components/ui/ActionButton.module.css
```

---

## Tested End-to-End Verification Transcript & Outcome

The CLI was tested against a clean, scaffolded consumer Vite + React + TypeScript project (`test-consumer`).

### Test Setup & Reproduction Commands

1. **Scaffold Fresh Consumer App:**
   ```bash
   npm create vite@latest test-consumer -- --template react-ts
   cd test-consumer
   npm install
   ```

2. **Install Free Component (`action-button`):**
   ```bash
   node "../packages/installer/dist/bin.js" action-button ./src/components/ui --api-url http://localhost:4000
   ```
   **Output / Outcome:**
   ```text
   [tech-inject] Fetching component "action-button"...

   ✓ Successfully installed "action-button" into ".../test-consumer/src/components/ui":
     + src/components/ui/ActionButton.tsx
     + src/components/ui/ActionButton.css
   ```
   *(Exit code: 0)*

3. **Verify Auth Gate on Premium Component (`metric-card` without token):**
   ```bash
   node "../packages/installer/dist/bin.js" metric-card ./src/components/ui --api-url http://localhost:4000
   ```
   **Output / Outcome:**
   ```text
   [tech-inject] Fetching component "metric-card"...
   ✖ Access denied: Active premium subscription required to access source code for 'metric-card'. Please log in with a premium account.
   ```
   *(Exit code: 1 — properly rejected)*

4. **Install Premium Component with Authenticated Session (`--token`):**
   ```bash
   # Obtain premium customer JWT token via POST /auth/login
   # premium.developer@tech-inject.dev (isPremium: true)
   
   node "../packages/installer/dist/bin.js" metric-card ./src/components/ui \
     --api-url http://localhost:4000 \
     --token "<JWT_TOKEN>"
   ```
   **Output / Outcome:**
   ```text
   [tech-inject] Fetching component "metric-card"...

   ✓ Successfully installed "metric-card" into ".../test-consumer/src/components/ui":
     + src/components/ui/MetricCard.tsx
     + src/components/ui/MetricCard.css
   ```
   *(Exit code: 0)*

5. **Verify Zero Catalogue-Specific Imports:**
   Both installed components only import standard React and self-contained CSS files:
   - `ActionButton.tsx`: `import React from 'react'; import './ActionButton.css';`
   - `MetricCard.tsx`: `import React from 'react'; import './MetricCard.css';`
   - No `@tech-inject/*` or monorepo package imports required.

6. **Render in Consumer `src/App.tsx` & Build:**
   ```tsx
   import React, { useState } from 'react';
   import { ActionButton } from './components/ui/ActionButton';
   import { MetricCard } from './components/ui/MetricCard';

   export function App() {
     const [clicks, setClicks] = useState(0);
     return (
       <div style={{ padding: '2rem' }}>
         <MetricCard label="Interactions" value={clicks.toString()} variant="positive" />
         <ActionButton variant="primary" onClick={() => setClicks(c => c + 1)}>
           Increment
         </ActionButton>
       </div>
     );
   }
   export default App;
   ```

   Run TypeScript build:
   ```bash
   npm run build
   ```
   **Output / Outcome:**
   ```text
   > test-consumer@0.0.0 build
   > tsc -b && vite build

   vite v6.4.1 building for production...
   transforming...
   ✓ 34 modules transformed.
   dist/index.html                   0.46 kB │ gzip:  0.30 kB
   dist/assets/index-D7P7OqWc.css    1.98 kB │ gzip:  0.77 kB
   dist/assets/index-Bt_u_iFf.js   144.20 kB │ gzip: 46.54 kB
   ✓ built in 579ms
   ```
   **Result: PASS (0 errors, 0 warnings, clean production bundle created).**

