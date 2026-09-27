# Tech-Inject: Enterprise React UI Component Registry & Catalogue

> A production-grade, secure React component distribution platform and CLI installer inspired by shadcn/ui — featuring an interactive component catalogue, admin management console, and a sandboxed MongoDB/GridFS registry backend.

---

## 🚀 Live Deployments

| Service | Live URL | Description |
| :--- | :--- | :--- |
| **Component Catalogue** | [https://tech-inject-catalogue.vercel.app/](https://tech-inject-catalogue.vercel.app/) | Interactive public component gallery, live DOM previews, prop controllers, and code generator |
| **Admin Console** | [https://tech-inject-admin.vercel.app/](https://tech-inject-admin.vercel.app/) | Admin dashboard for bundle ingestion, entitlement tiers, and component lifecycle management |
| **API Server & Registry** | [https://tech-inject-server.vercel.app/](https://tech-inject-server.vercel.app/) | Express.js API gateway, JWT auth, MongoDB/GridFS storage, and package distribution engine |

---

## 📦 Monorepo Architecture

Tech-Inject is structured as a Turborepo monorepo using npm workspaces:

```text
tech-inject/
├── apps/
│   ├── catalogue/             # Public Component Catalogue (Vite + React 19 + TypeScript)
│   └── admin/                 # Internal Admin Console (Vite + React 19 + TypeScript)
├── server/                    # API Gateway & GridFS Storage Engine (Express + MongoDB)
├── packages/
│   ├── installer/             # Secure CLI Component Installer (@tech-inject/installer)
│   ├── ui-theme/              # Design System Tokens, LiveComponentPreview & API Client
│   ├── types/                 # Shared TypeScript Data Contracts & Interfaces
│   └── config/                # Shared Environment & Metadata Constants
├── package.json               # Root npm workspaces configuration
├── turbo.json                 # Turborepo task pipeline
└── tsconfig.base.json         # Strict TypeScript root configuration
```

---

## ⚡ CLI Installer: Install Directly into Any React Project

Install individual, cleanly decoupled components directly into your application codebase with **zero runtime overhead**:

### 1. Free / Public Components
```bash
npx @tech-inject/installer crm-pipeline-table ./src/components/ui
```
```bash
npx @tech-inject/installer crm-detail-drawer ./src/components/ui
```
```bash
npx @tech-inject/installer win-probability-meter ./src/components/ui
```

### 2. Premium / Entitlement-Locked Components
```bash
npx @tech-inject/installer command-palette ./src/components/ui --token <YOUR_CUSTOMER_TOKEN>
```

### 3. CLI Features & Safety Guarantees
- **Pure Source Injection**: Injects raw `.tsx` and `.css` files into your chosen directory (`./src/components/ui/`).
- **Non-Destructive Overwrites**: Prevents accidental overwrites of modified local files unless `--overwrite` is explicitly specified.
- **Zero Monorepo Couplings**: Installed components contain clean, relative imports with zero dependencies on internal monorepo packages.
- **Dynamic Token Resolution**: Supports `--token <token>` or `TECH_INJECT_TOKEN` environment variable.

---

## 🎨 Featured Reusable Components

The registry includes high-performance components extracted from real-world enterprise CRM and productivity workflows:

| Component | Slug | Category | Access Tier | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Sales Pipeline Table** | `crm-pipeline-table` | Data Display | **Free** | Enterprise data table with deal stage pills, avatars, probability meters, cadence sparklines, and calculation footer |
| **Entity Detail Drawer** | `crm-detail-drawer` | Overlays | **Free** | Slide-over detail panel with contact channels, stage indicators, and health dials |
| **Activity Feed & Popover** | `crm-activity-feed` | Feedback | **Free** | Notification popover with tabbed filtering, team mentions, and inline comment bubbles |
| **Win Probability Meter** | `win-probability-meter` | Data Display | **Free** | Segmented multi-tier score gauge (emerald, amber, rose) with percentage readout |
| **CRM Filter Toolbar** | `crm-filter-toolbar` | Navigation | **Free** | Filter bar with stage dropdowns, date range filters, and quick action buttons |
| **Activity Sparkline** | `activity-sparkline-bar` | Analytics | **Free** | Micro bar-chart sparkline visualizing user and deal activity cadence |
| **Probability Range Slider** | `probability-range-slider` | Forms | **Free** | Precision numeric slider paired with real-time colored segmented meter feedback |
| **Search Input** | `search-input` | Forms | **Free** | Debounced search input with icon slot and clear trigger |
| **Command Palette** | `command-palette` | Navigation | **Premium** | Spotlight-style fuzzy search command palette with keyboard navigation |
| **Data Table** | `data-table` | Data Display | **Premium** | Sortable, paginated data grid with column configuration and row selection |
| **Analytics Chart Card** | `analytics-chart-card` | Cards | **Premium** | KPI stat card with inline trend badge and vector graph visualization |

---

## 🛡️ Security & Secret Redaction

Tech-Inject implements security-in-depth across storage, ingestion, and network channels:

1. **Storage Credentials & Log Sanitation**:
   - Automated redaction filter (`sanitizeSecrets`) protects all log outputs, error handlers, and stack traces.
   - Database URIs (`mongodb+srv://...`), JWT secrets, Bearer tokens, and password hashes are permanently shielded from logs.

2. **Bundle Ingestion Protection**:
   - Zero `eval()`, zero `exec()`: Uploaded bundle files are treated strictly as raw text streams.
   - Strict filename scanning: Blocks `.env*`, `credentials.json`, `secrets.json`, `*.pem`, `*.key`, and `id_rsa*`.
   - Content secret scanning: Rejects files containing private key headers, AWS access keys, GitHub tokens, or database connection strings.

3. **Public API Sanitation**:
   - Password hashes are never returned by any endpoint.
   - Component source bundles strip internal administrative metadata before returning to users.

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **MongoDB**: Local instance or MongoDB Atlas cluster URI

### Installation & Execution

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Prabhdeep26/tech-inject.git
   cd tech-inject
   ```

2. **Install all dependencies across the monorepo**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   In `server/.env`:
   ```env
   NODE_ENV=development
   PORT=4000
   CORS_ORIGIN=*
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/tech-inject
   JWT_SECRET=your_super_secret_jwt_key
   ADMIN_EMAIL=admin@tech-inject.dev
   ADMIN_PASSWORD_HASH=$2b$10$...
   ADMIN_SECRET=admin123
   ```

4. **Start the complete development environment**:
   ```bash
   npm run dev
   ```
   - **Component Catalogue**: `http://localhost:5173`
   - **Admin Console**: `http://localhost:5174`
   - **Backend API**: `http://localhost:4000`

### Build & Verification Commands
- `npm run build` — Compiles all workspaces via Turborepo
- `npm run typecheck` — Runs `tsc --noEmit` across all apps and packages
- `npm run test` — Executes test suites across server and packages
- `npm run lint` — Runs code quality and lint checks

---

## 📄 License

MIT © [Tech-Inject](https://github.com/Prabhdeep26/tech-inject)
