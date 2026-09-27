export const themeTokens = {
  colors: {
    // Canvas & Surface
    background: '#0B0F12',
    backgroundSubtle: '#12171B',
    surface: '#182026',
    surfaceElevated: '#232D34',

    // Borders & Dividers
    border: '#232323',
    borderMuted: '#263238',

    // Primary Brand & Interactive
    primary: '#00B562',
    primaryHover: '#009e56',
    primaryActive: '#008749',
    accentMuted: '#395E4D',
    accentSubtle: 'rgba(0, 181, 98, 0.15)',

    // Text & Foreground
    textPrimary: '#F9FBFF',
    textSecondary: '#A0AEC0',
    textMuted: '#7C8DA6',

    // Semantic Status Tokens
    status: {
      success: '#22C55E',      // Distinct success green (separate from brand primary #00B562)
      info: '#3B82F6',         // In Progress / Information
      danger: '#EF4444',       // Error / At Risk
      warning: '#F59E0B',      // In Review / Draft / Caution
    },

    // Tier Badges & Entitlements
    tier: {
      free: '#00B562',
      premium: '#A855F7',      // Distinct violet/purple accent (replaces amber/gold)
      premiumSubtle: 'rgba(168, 85, 247, 0.15)',
      premiumGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(126, 34, 206, 0.2))',
    },
    premium: '#A855F7',
    premiumSubtle: 'rgba(168, 85, 247, 0.15)',
  },

  typography: {
    fontFamily: {
      sans: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'Geist Mono, monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px - tags, meta labels
      sm: '0.875rem',   // 14px - compact table & card body text
      base: '1rem',     // 16px - standard UI text
      lg: '1.125rem',   // 18px - card titles, section headers
      xl: '1.25rem',    // 20px - modal titles
      '2xl': '1.5rem',  // 24px - stat card metric values
      h1: '1.75rem',    // 28px - standard dashboard & catalogue page titles
      display: '2.5rem',// 40px - hero / landing headings
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.625',
    },
  },

  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px (standard card padding)
    lg: '1rem',      // 16px (board column gaps)
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    '3xl': '3rem',   // 48px - hero sections & major vertical blocks
  },

  radius: {
    sm: '4px',
    md: '6px',       // Default for buttons, cards, and inputs
    lg: '8px',
    full: '9999px',  // Pill badges and avatars
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.45)', // Interactive card hover, floating modals
    glow: '0 0 12px rgba(0, 181, 98, 0.25)', // Primary button focus/active state
  },
} as const;

export type ThemeTokens = typeof themeTokens;
