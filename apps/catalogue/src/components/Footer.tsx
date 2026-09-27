import React from 'react';
import { themeTokens } from '@tech-inject/ui-theme';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: `1px solid ${themeTokens.colors.border}`,
        backgroundColor: themeTokens.colors.backgroundSubtle,
        padding: '2.5rem 0',
      }}
    >
      <div
        className="content-wrapper"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600, color: themeTokens.colors.textPrimary }}>
            Tech-Inject Catalogue
          </span>
          <span style={{ color: themeTokens.colors.textMuted }}>•</span>
          <span style={{ color: themeTokens.colors.textSecondary, fontSize: themeTokens.typography.fontSize.sm }}>
            Built with Vite, React, TypeScript & Design Tokens
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: themeTokens.typography.fontSize.xs,
            color: themeTokens.colors.textMuted,
          }}
        >
          &copy; {new Date().getFullYear()} Tech-Inject Monorepo. All rights reserved. Powered by @tech-inject/ui-theme & @tech-inject/types.
        </p>
      </div>
    </footer>
  );
};
