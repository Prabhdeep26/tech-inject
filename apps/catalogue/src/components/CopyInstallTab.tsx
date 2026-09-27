import React, { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  themeTokens,
} from '@tech-inject/ui-theme';
import type { Component } from '@tech-inject/types';

interface CopyInstallTabProps {
  component: Component;
}

interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

export const CopyInstallTab: React.FC<CopyInstallTabProps> = ({ component }) => {
  const [includePathFlag, setIncludePathFlag] = useState(false);
  const [includeOverwriteFlag, setIncludeOverwriteFlag] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Generated NPX Command
  const basePath = 'src/components';
  const npxCommand = `npx @tech-inject/cli add ${component.slug}${
    includePathFlag ? ` --path ${basePath}` : ''
  }${includeOverwriteFlag ? ' --overwrite' : ''}`;

  const showToast = (type: 'success' | 'error', text: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast('success', `Copied ${label} to clipboard!`);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('success', `Copied ${label} to clipboard!`);
      }
    } catch {
      showToast('error', `Failed to copy ${label}. Please copy manually.`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
      {/* Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          top: '5rem',
          right: '2rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: themeTokens.radius.md,
              backgroundColor: toast.type === 'success' ? '#064E3B' : '#7F1D1D',
              color: toast.type === 'success' ? '#6EE7B7' : '#FCA5A5',
              border: `1px solid ${toast.type === 'success' ? '#059669' : '#DC2626'}`,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <span>{toast.type === 'success' ? '✓' : '✕'}</span>
            <span>{toast.text}</span>
          </div>
        ))}
      </div>

      {/* Main NPX Command Card */}
      <Card variant="glass" padding="lg">
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <CardTitle>CLI Component Injection</CardTitle>
              <CardDescription>
                Install this component and its source bundle directly into your repository with one command.
              </CardDescription>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: themeTokens.typography.fontFamily.mono,
                backgroundColor: themeTokens.colors.surfaceElevated,
                color: themeTokens.colors.primary,
                padding: '0.2rem 0.6rem',
                borderRadius: themeTokens.radius.sm,
                border: `1px solid ${themeTokens.colors.border}`,
              }}
            >
              @tech-inject/cli v1.0
            </span>
          </div>
        </CardHeader>

        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Generated Command Terminal Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#0D1117',
              border: `1px solid ${themeTokens.colors.border}`,
              borderRadius: themeTokens.radius.md,
              padding: '1rem 1.25rem',
              fontFamily: themeTokens.typography.fontFamily.mono,
              fontSize: '0.9375rem',
              color: themeTokens.colors.textPrimary,
              boxShadow: themeTokens.shadows.sm,
              gap: '1rem',
              flexWrap: 'wrap',
              maxWidth: '100%',
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                overflowX: 'auto',
                maxWidth: '100%',
                minWidth: 0,
                flexGrow: 1,
                paddingBottom: '0.25rem',
              }}
            >
              <span style={{ color: themeTokens.colors.primary, fontWeight: 700, userSelect: 'none', flexShrink: 0 }}>
                $
              </span>
              <span style={{ color: '#38BDF8', whiteSpace: 'nowrap' }}>{npxCommand}</span>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleCopy(npxCommand, 'npx install command')}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Copy Command
            </Button>
          </div>

          {/* Optional CLI Flags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8125rem', color: themeTokens.colors.textSecondary, maxWidth: '100%' }}>
            <span style={{ fontWeight: 600, color: themeTokens.colors.textMuted }}>Flags:</span>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', maxWidth: '100%' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', cursor: 'pointer', maxWidth: '100%' }}>
                <input
                  type="checkbox"
                  checked={includePathFlag}
                  onChange={(e) => setIncludePathFlag(e.target.checked)}
                  style={{ marginTop: '0.2rem', flexShrink: 0 }}
                />
                <span style={{ wordBreak: 'break-word' }}>Specify target path (<code>--path src/components</code>)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', cursor: 'pointer', maxWidth: '100%' }}>
                <input
                  type="checkbox"
                  checked={includeOverwriteFlag}
                  onChange={(e) => setIncludeOverwriteFlag(e.target.checked)}
                  style={{ marginTop: '0.2rem', flexShrink: 0 }}
                />
                <span style={{ wordBreak: 'break-word' }}>Force overwrite existing files (<code>--overwrite</code>)</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Package Runners */}
      <Card variant="surface" padding="md">
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: themeTokens.colors.textPrimary, marginBottom: '0.75rem' }}>
          Alternative Package Runners
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.75rem' }}>
          {[
            { runner: 'pnpm dlx', cmd: `pnpm dlx @tech-inject/cli add ${component.slug}` },
            { runner: 'bunx', cmd: `bunx @tech-inject/cli add ${component.slug}` },
            { runner: 'yarn dlx', cmd: `yarn dlx @tech-inject/cli add ${component.slug}` },
          ].map((item) => (
            <div
              key={item.runner}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                backgroundColor: themeTokens.colors.backgroundSubtle,
                borderRadius: themeTokens.radius.md,
                border: `1px solid ${themeTokens.colors.border}`,
                fontFamily: themeTokens.typography.fontFamily.mono,
                fontSize: '0.75rem',
                minWidth: 0,
                maxWidth: '100%',
              }}
            >
              <span style={{ color: themeTokens.colors.textSecondary, overflowX: 'auto', whiteSpace: 'nowrap', marginRight: '0.5rem', minWidth: 0 }}>
                {item.cmd}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(item.cmd, `${item.runner} command`)}
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', flexShrink: 0 }}
              >
                Copy
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Prerequisite Setup Note */}
      <Card variant="surface" padding="lg">
        <CardHeader>
          <CardTitle style={{ fontSize: '1.125rem' }}>Prerequisite Setup &amp; Compatibility</CardTitle>
          <CardDescription>
            Verify your environment and consumer project configuration before running the install command.
          </CardDescription>
        </CardHeader>

        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Prerequisite 1: Node.js version */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div
              style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 181, 98, 0.15)',
                color: themeTokens.colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8125rem',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: '0.1rem',
              }}
            >
              1
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: themeTokens.colors.textPrimary, marginBottom: '0.25rem' }}>
                Node.js Runtime Requirement
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: themeTokens.colors.textSecondary, lineHeight: '1.5' }}>
                Requires <strong>Node.js &gt;= 20.0.0</strong> (Node 20 or Node 22 LTS strongly recommended). The CLI relies on native ECMAScript Modules (ESM) support and modern Fetch &amp; Web Streams APIs.
              </p>
            </div>
          </div>

          {/* Prerequisite 2: Supported Consumer Project Type */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div
              style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: themeTokens.colors.status.info,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8125rem',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: '0.1rem',
              }}
            >
              2
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: themeTokens.colors.textPrimary, marginBottom: '0.25rem' }}>
                Supported Consumer Project Type: <strong>Vite + React + TypeScript</strong>
              </div>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: themeTokens.colors.textSecondary, lineHeight: '1.5' }}>
                Tested and optimized for <strong>Vite + React (18 or 19) + TypeScript</strong> applications. Also fully compatible with Next.js 14/15 (App Router with <code>&apos;use client&apos;</code> directives).
              </p>
              <div
                style={{
                  backgroundColor: themeTokens.colors.backgroundSubtle,
                  border: `1px solid ${themeTokens.colors.border}`,
                  borderRadius: themeTokens.radius.sm,
                  padding: '0.6rem 0.85rem',
                  fontSize: '0.75rem',
                  color: themeTokens.colors.textMuted,
                  fontFamily: themeTokens.typography.fontFamily.mono,
                  wordBreak: 'break-all',
                  maxWidth: '100%',
                }}
              >
                Output target: <code>src/components/{component.name.replace(/[^a-zA-Z0-9]/g, '')}.tsx</code>
              </div>
            </div>
          </div>

          {/* Prerequisite 3: UI Theme Dependency */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div
              style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: themeTokens.colors.status.warning,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8125rem',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: '0.1rem',
              }}
            >
              3
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: themeTokens.colors.textPrimary, marginBottom: '0.25rem' }}>
                Design Token &amp; CSS Variables
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: themeTokens.colors.textSecondary, lineHeight: '1.5' }}>
                Ensure your application imports <code>@tech-inject/ui-theme</code> or sets the corresponding CSS variables (<code>--color-primary</code>, <code>--color-surface</code>, <code>--color-background</code>) in your root stylesheet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
