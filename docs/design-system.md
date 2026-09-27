# Tech-Inject Design System Specification

> **Source of Truth**: [`packages/ui-theme/src/tokens.ts`](file:///d:/My%20Code%20Base/tech-inject/packages/ui-theme/src/tokens.ts)  
> **Package**: `@tech-inject/ui-theme`  
> **Status**: Approved Foundation Spec (Token Corrections Incorporated)

---

## 1. Overview & Principles

The Tech-Inject design system is engineered for developers and autonomous AI agents building modern web applications. All UI styles across `@tech-inject/catalogue` and `@tech-inject/admin` are strictly derived from the unified design tokens in `@tech-inject/ui-theme`.

- **Strict Token Adherence**: No ad-hoc hex codes, custom margins, or magic numbers in components.
- **Dark-Theme-First**: Optimized for deep contrast, dark canvas aesthetics, subtle elevations, and focused green/violet accents.
- **Accessible (WCAG 2.1 AA compliant)**: Text and interactive elements meet or exceed contrast ratios with clear keyboard focus indicators.
- **Clear Separation of Concerns**: Semantic status colors (e.g. success green `#22C55E`) are distinct from interactive brand controls (`#00B562`), and premium entitlement tiers use a dedicated violet hue (`#A855F7`) distinct from caution/warning states (`#F59E0B`).

---

## 2. Spacing Scale

The spacing scale is an 8-point system with a 4px fine-tuning step for micro-elements (tags, badges, compact table cells) and a formal 48px token for major section layouts.

| Token | Rem Value | Pixel Value | CSS Variable | Standard Usage |
| :--- | :--- | :--- | :--- | :--- |
| `spacing.xs` | `0.25rem` | **4px** | `--spacing-xs` | Badge inner gap, tight inline element padding, icon-to-label spacing |
| `spacing.sm` | `0.5rem` | **8px** | `--spacing-sm` | Button vertical padding, input padding, filter chip gaps |
| `spacing.md` | `0.75rem` | **12px** | `--spacing-md` | Card compact padding, form label margin, table cell padding |
| `spacing.lg` | `1rem` | **16px** | `--spacing-lg` | Standard layout gaps, card default padding, grid gutter |
| `spacing.xl` | `1.5rem` | **24px** | `--spacing-xl` | Card large padding, section spacing, header bottom margin |
| `spacing['2xl']` | `2rem` | **32px** | `--spacing-2xl` | Page content margins, grid row gaps, modal inner padding |
| `spacing['3xl']` | `3rem` | **48px** | `--spacing-3xl` | Hero section padding, major page vertical blocks, top/bottom page gutters |

```ts
// Usage in React / TSX:
import { themeTokens } from '@tech-inject/ui-theme';

const sectionStyle = {
  paddingTop: themeTokens.spacing['3xl'], // 48px
  gap: themeTokens.spacing.lg,            // 16px
};
```

---

## 3. Typography Scale & Hierarchy

### Font Families
- **Sans-Serif (Primary UI)**: `Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` (`typography.fontFamily.sans`)
- **Monospace (Code / Slugs / Semver)**: `Geist Mono, monospace` (`typography.fontFamily.mono`)

### Font Weights
- **Normal (400)**: `typography.fontWeight.normal` — Body copy, descriptions
- **Medium (500)**: `typography.fontWeight.medium` — Navigation links, secondary button text
- **Semibold (600)**: `typography.fontWeight.semibold` — Subheadings, card titles, form labels
- **Bold (700)**: `typography.fontWeight.bold` — Page headings (H1), hero copy, metric values

### Line Heights
- **Tight (1.2)**: `typography.lineHeight.tight` — Headings, badges, compact titles
- **Normal (1.5)**: `typography.lineHeight.normal` — Standard body copy, inputs
- **Relaxed (1.625)**: `typography.lineHeight.relaxed` — Long-form descriptions, documentation

### Type Hierarchy Matrix & Page Mapping

| Element / Role | Token Size | Rem / Pixels | Font Weight | Line Height | Target Pages & Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display (Hero Heading)** | `fontSize.display` | `2.5rem` (40px) | **700 (Bold)** | `tight (1.2)` | **Landing / Home Page (`/`)**: Main marketing hero headline (`"Engineered UI Components for Modern Web & AI Agents"`) |
| **H1 (Standard Page Title)** | `fontSize.h1` | `1.75rem` (28px) | **700 (Bold)** | `tight (1.2)` | **Catalogue Directory (`/components`)**, **Admin Dashboard (`/`)**, **Customers Page (`/customers`)**, **Component Create/Edit Pages (`/components/new`, `/components/:id/edit`)**, **Component Detail (`/components/:slug`)** |
| **H2 (Section Header)** | `fontSize.xl` / `fontSize['2xl']` | `1.25rem` – `1.5rem` | **600 (Semibold)** | `tight (1.2)` | Section headers: `"Available Components"`, `"How It Works"`, `"Customer Entitlements"`, `"Pre-Publish Validation"` |
| **H3 (Card Title)** | `fontSize.lg` | `1.125rem` (18px) | **600 (Semibold)** | `tight (1.2)` | Component card names, modal dialog titles, metric block headers |
| **H4 (Sub-Header)** | `fontSize.base` | `1rem` (16px) | **600 (Semibold)** | `normal (1.5)` | Props schema table headers, form section sub-headers, code snippet titles |
| **Body (Standard)** | `fontSize.base` | `1rem` (16px) | **400 (Normal)** | `normal (1.5)` | General body copy, form inputs, component descriptions |
| **Body (Compact)** | `fontSize.sm` | `0.875rem` (14px) | **400 / 500** | `normal (1.5)` | Customer table cells, card descriptions, button labels, tabs |
| **Caption / Meta** | `fontSize.xs` | `0.75rem` (12px) | **500 / 600** | `normal (1.5)` | Version tags, category chips, entitlement pills, timestamps, helper text |
| **Monospace / Code** | `fontSize.xs` / `sm` | `0.75rem` / `0.875rem` | **400 / 600** | `tight (1.2)` | Component slugs, CLI commands, package names, TypeScript prop types |

---

## 4. Consistent Color Palette

### 4.1 Background Layers (Elevation Depth)
The canvas uses four hierarchical dark layers to create spatial depth without noisy textures:

| Layer Name | Token | Hex Value | CSS Variable | Intended Application |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas Background** | `colors.background` | `#0B0F12` | `--color-background` | Root app background, page base canvas |
| **Subtle Background** | `colors.backgroundSubtle` | `#12171B` | `--color-background-subtle` | Table header strips, code block background, footers |
| **Surface** | `colors.surface` | `#182026` | `--color-surface` | Default cards, panels, list containers, modals |
| **Elevated Surface** | `colors.surfaceElevated` | `#232D34` | `--color-surface-elevated` | Hover cards, elevated popovers, active controls, dropdown menus |

### 4.2 Border & Divider Colors

| Border Name | Token | Hex Value | CSS Variable | Intended Application |
| :--- | :--- | :--- | :--- | :--- |
| **Standard Border** | `colors.border` | `#232323` | `--color-border` | Default card borders, table dividers, input borders |
| **Muted Border** | `colors.borderMuted` | `#263238` | `--color-border-muted` | Elevated cards, glass panel edges, subtle separators |
| **Accent Muted** | `colors.accentMuted` | `#395E4D` | `--color-accent-muted` | Focused card borders, interactive hover outlines |

### 4.3 Text Hierarchy (Contrast Calibration)

| Level | Token | Hex Value | CSS Variable | Contrast / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Text** | `colors.textPrimary` | `#F9FBFF` | `--color-text-primary` | High contrast (near white); titles, active labels, primary headings |
| **Secondary Text** | `colors.textSecondary` | `#A0AEC0` | `--color-text-secondary` | Medium contrast (slate-300); body copy, card descriptions, subtitle metadata |
| **Muted Text** | `colors.textMuted` | `#7C8DA6` | `--color-text-muted` | WCAG AA compliant (4.6:1 against `#0B0F12`); timestamps, captions (12px), placeholders, meta tags |

*Note*: `textMuted` is calibrated to `#7C8DA6` to ensure it clears the 4.5:1 contrast ratio against the `#0B0F12` canvas background for WCAG AA compliance even at small text sizes (12px captions, timestamps, placeholders), while remaining clearly subordinate to `textSecondary` (`#A0AEC0`).

### 4.4 Brand & Interactive Accent

| State / Role | Token | Value | CSS Variable | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Brand Primary** | `colors.primary` | `#00B562` | `--color-primary` | Primary action buttons, active navigation indicator, brand logos |
| **Primary Hover** | `colors.primaryHover` | `#009e56` | `--color-primary-hover` | Hover state for primary interactive elements |
| **Primary Active** | `colors.primaryActive` | `#008749` | `--color-primary-active` | Pressed / clicked state for primary controls |
| **Accent Subtle** | `colors.accentSubtle` | `rgba(0, 181, 98, 0.15)` | `--color-accent-subtle` | Button outline hover, tag backgrounds, active item tint |
| **Accent Muted** | `colors.accentMuted` | `#395E4D` | `--color-accent-muted` | Focus ring accents, card highlight outlines |

### 4.5 Semantic Status & Entitlement Tokens

| Semantic Role | Token | Hex Value | Background Tint | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `colors.status.success` | `#22C55E` | `rgba(34, 197, 94, 0.15)` | Published components, granted entitlements, passing checks (visually distinct from brand primary `#00B562`) |
| **Warning / Draft** | `colors.status.warning` | `#F59E0B` | `rgba(245, 158, 11, 0.15)` | Draft status, in review, non-breaking warnings |
| **Danger / Error** | `colors.status.danger` | `#EF4444` | `rgba(239, 68, 68, 0.15)` | Error alerts, revoked access, validation rejections |
| **Info** | `colors.status.info` | `#3B82F6` | `rgba(59, 130, 246, 0.15)` | Informational badges, documentation callouts |
| **Premium Entitlement** | `colors.tier.premium` / `colors.premium` | `#A855F7` | `rgba(168, 85, 247, 0.15)` | **Violet/Purple accent** for premium badges (`premiumGradient`: `linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(126, 34, 206, 0.2))`) |

---

## 5. Border-Radius Scale

| Token | Value | CSS Variable | Intended Application |
| :--- | :--- | :--- | :--- |
| `radius.sm` | **4px** | `--radius-sm` | Code tags, inline snippets, scrollbar thumbs, micro tags |
| `radius.md` | **6px** | `--radius-md` | **Default** for buttons, text inputs, textareas, select menus, alert banners |
| `radius.lg` | **8px** | `--radius-lg` | Default cards, glass panels, modal dialogs, preview wrappers |
| `radius.full` | **9999px**| `--radius-full`| Status pills, category chips, user avatar circles, status indicator dots |

---

## 6. Shadow & Elevation Levels

| Level / Token | Definition | CSS Variable | Purpose |
| :--- | :--- | :--- | :--- |
| **Low (`shadows.sm`)** | `0 1px 2px 0 rgba(0, 0, 0, 0.4)` | `--shadow-sm` | Default button shadow, input resting state, subtle separation |
| **Medium (`shadows.md`)** | `0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)` | `--shadow-md` | Resting cards, dropdowns, table elevation |
| **Glow (`shadows.glow`)** | `0 0 12px rgba(0, 181, 98, 0.25)` | `--shadow-glow` | Primary button hover/focus, active selection glow |
| **High / Hover** | `0 8px 24px rgba(0, 0, 0, 0.45)` | `--shadow-lg` | Interactive card hover (`translateY(-2px)`), floating modals |

---

## 7. Component Style Rules & Patterns

### 7.1 Buttons
- **Primary**: Background `colors.primary`, text `#0B0F12` (dark, high contrast), border `none`, radius `radius.md`. On hover: `colors.primaryHover`, shadow `shadows.glow`. On active: `colors.primaryActive`.
- **Secondary**: Background `colors.surfaceElevated`, text `colors.textPrimary`, border `1px solid colors.border`, radius `radius.md`.
- **Outline**: Background `transparent`, text `colors.primary`, border `1px solid colors.primary`, radius `radius.md`. On hover: background `colors.accentSubtle`.
- **Ghost**: Background `transparent`, text `colors.textSecondary`, border `none`. On hover: background `colors.surfaceElevated`, text `colors.textPrimary`.

### 7.2 Cards & Containers
- **Resting**: Background `colors.surface`, border `1px solid colors.border`, radius `radius.lg`, shadow `shadows.md`.
- **Interactive**: Transition `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`. On hover: `transform: translateY(-2px)`, border `1px solid colors.accentMuted`, shadow `0 8px 24px rgba(0, 0, 0, 0.45)`.
- **Glass Panel**: Background `rgba(24, 32, 38, 0.7)`, `backdrop-filter: blur(12px)`, border `1px solid colors.borderMuted`.

### 7.3 Form Inputs
- Background: `colors.backgroundSubtle` (`#12171B`)
- Border: `1px solid colors.border` (`#232323`)
- Radius: `radius.md` (`6px`)
- Font: `typography.fontFamily.sans`, size `typography.fontSize.sm` (`14px`)
- Focus: Border `1px solid colors.primary`, outline `none`, shadow `0 0 0 2px rgba(0, 181, 98, 0.2)`.

### 7.4 Alerts & Error Messages
- Always use `<ErrorMessage />` or `<ErrorState />` from `@tech-inject/ui-theme`.
- Danger Alert: Background `rgba(239, 68, 68, 0.12)`, border `1px solid rgba(239, 68, 68, 0.3)`, text `#F87171`, radius `radius.md`.
- Success Alert: Background `rgba(34, 197, 94, 0.15)`, border `1px solid rgba(34, 197, 94, 0.3)`, text `#22C55E`, radius `radius.md`.

---

## 8. Verification & Component Application Policy
*Per project requirements, component styling modifications are strictly deferred until this specification and corrected token set are formally reviewed and approved.*
