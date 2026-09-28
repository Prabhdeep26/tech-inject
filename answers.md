# Technical Implementation & Architecture Q&A

### 1. Reference Analysis
I inspected the Sales CRM reference (https://sales-crm-kargulstudio.vercel.app/) and extracted distinct UI patterns as components (`win-probability-meter`, `activity-sparkline-bar`, `crm-filter-toolbar`, `probability-range-slider`, `crm-detail-drawer`, `crm-activity-feed`, `crm-pipeline-table`), mapping its colours to `@tech-inject/ui-theme` tokens (`#00B562` primary, `#182026` surface, `#263238` border). One boundary I chose: `WinProbabilityMeter` takes a raw `value: number` and renders 10 colour-graded segments, rather than being coupled to CRM pipeline entities, so it drops into any consumer app. I rejected importing CRM state stores for the same reason. I verified fidelity by seeding all seven components via `server/src/db/seed-sales-crm.ts` and comparing them side by side with the reference in `packages/ui-theme/src/LiveComponentPreview.tsx` (screenshots: `references/[filenames]`).

---

### 2. Architecture & Clean Code
I chose a Turborepo monorepo separating the Express API (`server`), two Vite apps (`apps/catalogue`, `apps/admin`) and shared packages (`@tech-inject/types`, `@tech-inject/ui-theme`, `@tech-inject/installer`). For DRY/SOLID, `packages/types` is the single source of truth for the Mongoose models, the API envelope (`{ status, data }`) and the React frontends, so schemas cannot drift between packages. Under KISS/YAGNI I avoided a runtime browser sandbox (WebContainers or an iframe compiler) and global state managers like Redux/Zustand. Instead I used React Context for auth in `apps/catalogue/src/context/AuthContext.tsx` and `apps/admin/src/context/AdminAuthContext.tsx`.

---

### 3. Publishing Consistency
`apps/catalogue/src/pages/ComponentDetailPage.tsx` fetches `/components/:slug/source` once and shares that one bundle across the Preview, Props, Copy Code, Copy Install and Copy Agent Prompt tabs. Consistency is backed by a compound unique index on `{ slug: 1, version: 1 }` in `server/src/models/ComponentBundle.ts`, with files written to GridFS before metadata is committed. If staging or validation fails, the write aborts and the previous published version stays live. When a component is unpublished (`status !== 'published'`), the public list and detail routes return 404, while historical GridFS archives are kept so existing consumer installs are not broken.

---

### 4. Security
The main risks were stored XSS in previews, privilege escalation through admin or customer endpoints, and directory traversal during installation. I implemented `httpOnly`, `secure` JWT cookies (`sameSite: 'none'` in production, `'lax'` in development) with a Bearer-token fallback in `packages/ui-theme/src/apiClient.ts` for cross-origin Vercel domains. I also added path-traversal sanitisation in the installer, an explicit 403 in `PATCH /auth/me` (`server/src/routes/auth.ts`) if a customer tries to change `isPremium` or `isAdmin`, and a `CodeBlock.tsx` refactor that removes raw HTML injection. Limitation: previews currently render curated React nodes directly in the virtual DOM, so untrusted user uploads would need an isolated `sandbox="allow-scripts"` iframe, which I have not built.

---

### 5. AI Ownership
I challenged two AI outputs. The regex highlighter in `CodeBlock.tsx` injected broken `600;` literals into CSS strings and produced 14 empty trailing lines, so I replaced it with line-by-line whitespace normalisation. The fallback in `LiveComponentPreview.tsx` showed a dummy button for `search-input`, so I replaced it with a working component (debounced search dropdown and clear button). To check the bundles work outside the catalogue, I confirmed each GridFS bundle uses only standard imports (`import React from 'react'`), plain CSS and no `@tech-inject/catalogue` internals, and that consumers compile with `tsc && vite build`. Consumer project: `[folder name]`; agent-prompt result and any corrections: `[record outcome]`.

---

### 6. Production Ownership
I confirmed readiness with Playwright end-to-end tests (`[N/N passing]`) covering sign-in, responsive navigation and interactive previews, plus production builds passing across all workspaces. The apps run on Vercel at https://tech-inject-catalogue.vercel.app/, https://tech-inject-admin.vercel.app/ and https://tech-inject-server.vercel.app/, with cached MongoDB connections in `server/src/app.ts` and a public `GET /health` endpoint reporting `readyState`. If a newly published component broke, I would first check `server/src/middleware/errorHandler.ts` logs and client console errors to tell a malformed prop from GridFS bundle corruption. I would restore service by setting `status: 'draft'` or rolling back the `version` pointer in `server/src/models/Component.ts` (GridFS history stays intact, so no data is lost), then tell the team the affected slug, the rollback version and an incident timeline.

---

### 7. Premium Access
`server/src/models/User.ts` stores separate `isPremium` and `isAdmin` flags, while each component carries an independent `accessLevel: 'free' | 'premium'` and a publication `status`. For a free or revoked user, `ComponentDetailPage.tsx` shows a locked card with no source, and `/components/:slug/source` returns 403 with a `lockReason`. The CLI and agent integration authenticate with a Bearer token (`TECH_INJECT_TOKEN` or `--token`) against `https://tech-inject-server.vercel.app` and get the same 403 on premium endpoints. Revocation cannot remove source a customer already downloaded or committed to their own repository; it only blocks future retrieval.