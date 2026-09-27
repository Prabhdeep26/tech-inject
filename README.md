# tech-inject

Turborepo monorepo using npm workspaces.

## Repository Structure

```text
tech-inject/
├── apps/
│   ├── admin/             # Admin application console
│   └── catalogue/         # Public component catalogue
├── server/                # Express API gateway & MongoDB/GridFS storage
├── packages/
│   ├── config/            # Shared configuration
│   ├── installer/         # Secure CLI component installer (@tech-inject/installer)
│   ├── types/             # Shared TypeScript types
│   └── ui-theme/          # Shared UI theme & LiveComponentPreview component
├── package.json           # Root npm workspaces config
├── turbo.json             # Turborepo task pipeline
├── tsconfig.base.json     # Base TypeScript configuration (strict: true)
└── .gitignore
```

## Workspaces Setup

Configured in [package.json](package.json) via npm `workspaces`:
- `apps/*`
- `server`
- `packages/*`

## Available Scripts

- `npm run build` - Build all packages and applications via Turborepo
- `npm run lint` - Lint all packages and applications
- `npm run typecheck` - Typecheck all packages using TypeScript (`tsc --noEmit`)
- `npm run test` - Run tests across packages
- `npm run dev` - Run development mode across packages

---

## Consumer Quickstart: Using the CLI via `npx`

To install components from a deployed Tech-Inject backend into a brand-new, empty consumer React + TypeScript project:

### 1. Scaffold a fresh consumer application
```bash
npm create vite@latest my-consumer-app -- --template react-ts
cd my-consumer-app
npm install
```

### 2. Run the installer via `npx`
```bash
# Public / Free components:
npx @tech-inject/installer action-button ./src/components/ui --api-url https://api.tech-inject.dev

# Protected / Premium components:
npx @tech-inject/installer pro-data-grid ./src/components/ui \
  --api-url https://api.tech-inject.dev \
  --token <YOUR_CUSTOMER_TOKEN>
```

### 3. Use the component in `src/App.tsx`
```tsx
import React from 'react';
import { ActionButton } from './components/ui/ActionButton';

export function App() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Consumer Project</h1>
      <ActionButton onClick={() => console.log('Clicked')}>
        Action Button
      </ActionButton>
    </div>
  );
}

export default App;
```

### 4. Verified End-to-End Test Outcome
Tested against a clean consumer Vite + React-TS project with zero monorepo/catalogue dependencies:
- Free component (`action-button`): installed successfully.
- Premium component (`metric-card`): unauthenticated access correctly rejected with 403; installed successfully when authenticated.
- Consumer build (`tsc -b && vite build`): passes with 0 errors.

---

## Security Audit & Secret Leakage Prevention

A systematic security audit was conducted across all logging channels, API responses, error handlers, and component bundle validation routines:

1. **Storage Credentials & Error Log Redaction**:
   - Implemented `sanitizeSecrets` in [server/src/middleware/errorHandler.ts](server/src/middleware/errorHandler.ts) and [server/src/db/mongoose.ts](server/src/db/mongoose.ts).
   - Automatically redacts MongoDB connection URIs (`mongodb://***:***@...` and `mongodb+srv://...`), Bearer authorization headers, raw JWT tokens, and key/password fields from all log lines, error messages, and development stack traces.
   - In production (`NODE_ENV === "production"`), unhandled 500 error messages return a generic message to prevent leaking internal infrastructure details.

2. **Bundle File Content & Filename Secret Scanning**:
   - In [server/src/validations/bundle.ts](server/src/validations/bundle.ts), component bundles are scanned for forbidden filenames (`.env*`, `credentials.json`, `secrets.json`, `*.pem`, `*.key`, `id_rsa*`).
   - File contents are scanned for embedded private keys (`BEGIN ... PRIVATE KEY`), live AWS access keys (`AKIA...`), GitHub personal access tokens (`ghp_...`), and connection URIs with embedded passwords. Any match triggers rejection with an explicit security violation error.

3. **Public API Response Sanitation**:
   - **User Accounts**: In [server/src/routes/auth.ts](server/src/routes/auth.ts) and [server/src/routes/admin.ts](server/src/routes/admin.ts), user objects returned via registration, login, profile updates, and customer management explicitly map only safe public attributes (`id`, `email`, `isAdmin`, `isPremium`), guaranteeing password hashes are never present.
   - **Catalogue Bundles**: In [server/src/routes/components.ts](server/src/routes/components.ts), public component and catalogue listings strip `uploadedBy` (internal admin emails) from bundle payloads.

Automated verification suite is maintained in [server/src/validations/secret-redaction.test.ts](server/src/validations/secret-redaction.test.ts).

See [packages/installer/README.md](packages/installer/README.md) for CLI installation commands, security specifications, and overwrite protections.
