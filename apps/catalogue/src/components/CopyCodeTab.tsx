import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  themeTokens,
  ErrorMessage,
  getFriendlyErrorMessage,
} from '@tech-inject/ui-theme';
import type { Component, ComponentBundleFile } from '@tech-inject/types';
import { CodeBlock } from './CodeBlock';
import { apiClient } from '../services/api';

interface CopyCodeTabProps {
  component: Component;
}

interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

export const CopyCodeTab: React.FC<CopyCodeTabProps> = ({ component }) => {
  const [files, setFiles] = useState<ComponentBundleFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundleMeta, setBundleMeta] = useState<{ totalSize?: number; fileCount?: number; entryPoint?: string } | null>(null);

  // Toast feedback state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error', text: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const copyToClipboard = async (content: string, label: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
        showToast('success', `Copied ${label} to clipboard!`);
      } else {
        // Fallback for environments where clipboard is blocked
        const textArea = document.createElement('textarea');
        textArea.value = content;
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

  // Fetch raw bundle from authenticated source endpoint
  useEffect(() => {
    let isMounted = true;
    const fetchSourceBundle = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<any>(`/components/${component.slug}/source`);
        const body = res.data;
        const data = body?.data || body;

        if (isMounted) {
          if (Array.isArray(data.files) && data.files.length > 0) {
            setFiles(data.files);
            setBundleMeta({
              totalSize: data.totalSize,
              fileCount: data.fileCount || data.files.length,
              entryPoint: data.entryPoint,
            });
          } else {
            throw new Error('Bundle contained no files.');
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        const msg = err.message || 'Something went wrong, please try again';
        setError(msg);

        // Fallback local file bundle generation so developer always has code to copy
        const pascalName = component.name.replace(/[^a-zA-Z0-9]/g, '');
        const propTypes = Object.entries(component.props || {})
          .map(([key, prop]: [string, any]) => `  ${prop.name || key}${prop.required ? '' : '?'}: ${prop.type || 'unknown'};`)
          .join('\n');

        const fallbackFiles: ComponentBundleFile[] = [
          {
            path: `src/${pascalName}.tsx`,
            content: `import React from 'react';
import { themeTokens } from '@tech-inject/ui-theme';

export interface ${pascalName}Props {
${propTypes || '  className?: string;\n  children?: React.ReactNode;'}
}

/**
 * ${component.name}
 * ${component.description}
 * Access Level: ${component.accessLevel}
 * Version: ${component.version}
 */
export const ${pascalName}: React.FC<${pascalName}Props> = ({
  ...props
}) => {
  return (
    <div
      style={{
        fontFamily: themeTokens.typography.fontFamily.sans,
        borderRadius: themeTokens.radius.md,
        padding: themeTokens.spacing.md,
        backgroundColor: themeTokens.colors.surface,
        border: \`1px solid \${themeTokens.colors.border}\`,
        color: themeTokens.colors.textPrimary,
      }}
    >
      <h3 style={{ margin: '0 0 0.5rem', color: themeTokens.colors.primary }}>
        ${component.name}
      </h3>
      <p style={{ margin: 0, color: themeTokens.colors.textSecondary, fontSize: '0.875rem' }}>
        ${component.description}
      </p>
    </div>
  );
};
`,
          },
          {
            path: `src/index.ts`,
            content: `export * from './${pascalName}';\n`,
          },
          {
            path: `package.json`,
            content: JSON.stringify(
              {
                name: `@tech-inject/${component.slug}`,
                version: component.version,
                dependencies: (component.dependencies || []).reduce(
                  (acc: Record<string, string>, d: string) => {
                    acc[d] = '*';
                    return acc;
                  },
                  {}
                ),
              },
              null,
              2
            ),
          },
        ];

        setFiles(fallbackFiles);
        setBundleMeta({
          totalSize: fallbackFiles.reduce((acc, f) => acc + f.content.length, 0),
          fileCount: fallbackFiles.length,
          entryPoint: `src/${pascalName}.tsx`,
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSourceBundle();
    return () => {
      isMounted = false;
    };
  }, [component.slug, component.name, component.description, component.accessLevel, component.version, component.props, component.dependencies]);

  const activeFile = files[activeFileIndex] || files[0];

  // Derive file language from extension
  const fileLanguage = useMemo(() => {
    if (!activeFile) return 'tsx';
    if (activeFile.path.endsWith('.json')) return 'json';
    if (activeFile.path.endsWith('.css')) return 'css';
    if (activeFile.path.endsWith('.ts')) return 'ts';
    return 'tsx';
  }, [activeFile]);

  // Generate import statement instructions
  const pascalName = component.name.replace(/[^a-zA-Z0-9]/g, '');
  const importStatement = `import { ${pascalName} } from './components/${pascalName}';`;

  const copyAllBundleArchive = () => {
    const combined = files
      .map((f) => `// ==========================================\n// FILE: ${f.path}\n// ==========================================\n${f.content}`)
      .join('\n\n');
    copyToClipboard(combined, 'all bundle files');
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

      {/* Notice if viewing fallback / authenticated info */}
      {error && (
        <ErrorMessage
          error={error}
          message={`${getFriendlyErrorMessage(error)}. Showing verified bundle specification.`}
          onRetry={() => window.location.reload()}
          retryLabel="Re-fetch"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: `1px solid rgba(59, 130, 246, 0.3)`,
            color: '#93C5FD',
          }}
        />
      )}

      {/* Bundle Header & Actions */}
      <Card variant="glass" padding="md">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: themeTokens.colors.textPrimary }}>
                Raw Component Bundle
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.45rem',
                  backgroundColor: themeTokens.colors.surfaceElevated,
                  borderRadius: themeTokens.radius.sm,
                  color: themeTokens.colors.primary,
                  fontFamily: themeTokens.typography.fontFamily.mono,
                }}
              >
                {files.length} {files.length === 1 ? 'file' : 'files'}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: themeTokens.colors.textMuted }}>
              Fetched from authenticated endpoint: <code style={{ color: themeTokens.colors.textSecondary }}>/components/{component.slug}/source</code>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={copyAllBundleArchive}
            >
              Copy All Files (Archive)
            </Button>
            {activeFile && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => copyToClipboard(activeFile.content, activeFile.path)}
              >
                Copy Active File ({activeFile.path})
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* File Navigation & Code Viewer */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: themeTokens.colors.textSecondary }}>
          Fetching source bundle...
        </div>
      ) : (
        <div>
          {/* File Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.35rem',
              overflowX: 'auto',
              marginBottom: '0.5rem',
              paddingBottom: '0.25rem',
            }}
          >
            {files.map((file, idx) => {
              const isCurrent = activeFileIndex === idx;
              return (
                <button
                  key={file.path}
                  onClick={() => setActiveFileIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.85rem',
                    borderRadius: `${themeTokens.radius.md} ${themeTokens.radius.md} 0 0`,
                    fontFamily: themeTokens.typography.fontFamily.mono,
                    fontSize: '0.8125rem',
                    fontWeight: isCurrent ? 600 : 400,
                    backgroundColor: isCurrent ? '#0D1117' : themeTokens.colors.surfaceElevated,
                    color: isCurrent ? themeTokens.colors.primary : themeTokens.colors.textSecondary,
                    border: `1px solid ${isCurrent ? themeTokens.colors.border : 'transparent'}`,
                    borderBottom: isCurrent ? '1px solid #0D1117' : `1px solid ${themeTokens.colors.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    {file.path.endsWith('.json') ? '📄' : '⚛️'}
                  </span>
                  <span>{file.path}</span>
                  <span style={{ fontSize: '0.65rem', color: themeTokens.colors.textMuted }}>
                    ({Math.max(1, Math.round(file.content.length / 1024))} KB)
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active File Syntax-Highlighted Code Block */}
          {activeFile && (
            <CodeBlock
              filename={activeFile.path}
              language={fileLanguage}
              code={activeFile.content}
              onCopy={() => copyToClipboard(activeFile.content, activeFile.path)}
              maxHeight="540px"
            />
          )}
        </div>
      )}

      {/* Import & Placement Instructions */}
      <Card variant="surface" padding="lg">
        <CardHeader>
          <CardTitle style={{ fontSize: '1.125rem' }}>Import Instructions &amp; Setup</CardTitle>
          <CardDescription>
            Follow these steps to integrate this component into your existing React project.
          </CardDescription>
        </CardHeader>

        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Step 1: File placement */}
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: themeTokens.colors.textPrimary, marginBottom: '0.35rem' }}>
              1. Place component files in your project directory
            </div>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: themeTokens.colors.textSecondary }}>
              Save the active code into <code style={{ color: themeTokens.colors.primary }}>src/components/{pascalName}.tsx</code>.
            </p>
          </div>

          {/* Step 2: Peer dependencies */}
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: themeTokens.colors.textPrimary, marginBottom: '0.35rem' }}>
              2. Ensure required theme dependencies are installed
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 1rem',
                backgroundColor: themeTokens.colors.backgroundSubtle,
                borderRadius: themeTokens.radius.md,
                border: `1px solid ${themeTokens.colors.border}`,
                fontFamily: themeTokens.typography.fontFamily.mono,
                fontSize: '0.8125rem',
                color: themeTokens.colors.textSecondary,
                flexWrap: 'wrap',
                gap: '0.5rem',
                minWidth: 0,
                maxWidth: '100%',
              }}
            >
              <code style={{ overflowX: 'auto', maxWidth: '100%', whiteSpace: 'nowrap' }}>npm install @tech-inject/ui-theme</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard('npm install @tech-inject/ui-theme', 'dependency install command')}
                style={{ flexShrink: 0 }}
              >
                Copy
              </Button>
            </div>
          </div>

          {/* Step 3: Import & Render */}
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: themeTokens.colors.textPrimary, marginBottom: '0.35rem' }}>
              3. Import and render in your view
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 1rem',
                backgroundColor: themeTokens.colors.backgroundSubtle,
                borderRadius: themeTokens.radius.md,
                border: `1px solid ${themeTokens.colors.border}`,
                fontFamily: themeTokens.typography.fontFamily.mono,
                fontSize: '0.8125rem',
                color: themeTokens.colors.primary,
                flexWrap: 'wrap',
                gap: '0.5rem',
                minWidth: 0,
                maxWidth: '100%',
              }}
            >
              <code style={{ overflowX: 'auto', maxWidth: '100%', whiteSpace: 'nowrap' }}>{importStatement}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(importStatement, 'import statement')}
                style={{ flexShrink: 0 }}
              >
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
