import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  themeTokens,
  ErrorState,
  getFriendlyErrorMessage,
} from '@tech-inject/ui-theme';
import type { Component, ComponentBundleFile } from '@tech-inject/types';
import { fallbackComponents } from '../data/mockComponents';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { LiveComponentPreview } from '../components/LiveComponentPreview';
import { CopyCodeTab } from '../components/CopyCodeTab';
import { CopyInstallTab } from '../components/CopyInstallTab';
import { CopyAgentPromptTab } from '../components/CopyAgentPromptTab';

type TabKey = 'preview' | 'props' | 'code' | 'install' | 'agent';

export const ComponentDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [component, setComponent] = useState<Component | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string>('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabKey>('preview');

  // Source files & file selection
  const [sourceFiles, setSourceFiles] = useState<ComponentBundleFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const tabs: { id: TabKey; label: string }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'props', label: 'Props & Usage Docs' },
    { id: 'code', label: 'Copy Code' },
    { id: 'install', label: 'Copy Install' },
    { id: 'agent', label: 'Copy Agent Prompt' },
  ];

  const tabIcons: Record<TabKey, React.ReactNode> = {
    preview: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    props: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    code: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    install: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
    agent: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8" y2="16.01" />
        <line x1="16" y1="16" x2="16" y2="16.01" />
      </svg>
    ),
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % tabs.length;
      const nextId = tabs[nextIndex].id;
      setActiveTab(nextId);
      document.getElementById(`tab-${nextId}`)?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      const prevId = tabs[prevIndex].id;
      setActiveTab(prevId);
      document.getElementById(`tab-${prevId}`)?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      const firstId = tabs[0].id;
      setActiveTab(firstId);
      document.getElementById(`tab-${firstId}`)?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const lastId = tabs[tabs.length - 1].id;
      setActiveTab(lastId);
      document.getElementById(`tab-${lastId}`)?.focus();
    }
  };

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    const fetchComponent = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<any>(`/components/${slug}`);
        const body = res.data;
        const dataComp = body?.data?.component || body?.component;

        if (dataComp) {
          setComponent(dataComp);
          const isPremiumComp = dataComp.accessLevel === 'premium';
          const hasAccess = !isPremiumComp || Boolean(user && user.isPremium);
          if (dataComp.isLocked || !hasAccess) {
            setIsLocked(true);
            setLockReason(
              dataComp.lockReason ||
                'Premium subscription required. Upgrade your account to unlock source code, bundle files, and full prop definitions.'
            );
          } else {
            setIsLocked(false);
          }
        } else {
          throw new Error('Component not found');
        }
      } catch (err: any) {
        // Fallback to local catalog definition for seamless offline previewing
        const found = fallbackComponents.find((c) => c.slug === slug);
        if (found) {
          setComponent(found);
          const isPremiumComp = found.accessLevel === 'premium';
          const hasAccess = !isPremiumComp || Boolean(user && user.isPremium);
          if (!hasAccess) {
            setIsLocked(true);
            setLockReason(
              'Premium subscription required. Upgrade your account to unlock source code, bundle files, and full prop definitions.'
            );
          } else {
            setIsLocked(false);
          }
        } else {
          setError(err.message || 'Something went wrong, please try again');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchComponent();
  }, [slug, user]);

  // Fetch or construct source files when unlocked
  useEffect(() => {
    if (!component || isLocked) return;

    const fetchSource = async () => {
      try {
        const res = await apiClient.get<any>(`/components/${slug}/source`);
        const files = res.data?.data?.files || res.data?.files;
        if (Array.isArray(files) && files.length > 0) {
          setSourceFiles(files);
          return;
        }
      } catch {
        // Ignore and fallback below
      }

      // Generate standard component source files from spec
      const pascalName = component.name.replace(/[^a-zA-Z0-9]/g, '');
      const propTypes = Object.entries(component.props || {})
        .map(([key, prop]: [string, any]) => `  ${prop.name || key}${prop.required ? '' : '?'}: ${prop.type || 'unknown'};`)
        .join('\n');

      setSourceFiles([
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
      <h3>${component.name}</h3>
      <p style={{ color: themeTokens.colors.textSecondary }}>${component.description}</p>
    </div>
  );
};
`,
        },
        {
          path: 'package.json',
          content: JSON.stringify(
            {
              name: `@tech-inject/${component.slug}`,
              version: component.version,
              dependencies: (component.dependencies || []).reduce(
                (acc: Record<string, string>, dep: string) => {
                  acc[dep] = '*';
                  return acc;
                },
                {}
              ),
            },
            null,
            2
          ),
        },
      ]);
    };

    fetchSource();
  }, [component, slug, isLocked]);

  // Generate Usage Example Code
  const usageCode = useMemo(() => {
    if (!component) return '';
    const pascalName = component.name.replace(/[^a-zA-Z0-9]/g, '');
    return `import React from 'react';
import { ${pascalName} } from '@tech-inject/${component.slug}';

export const ExampleUsage = () => {
  return (
    <${pascalName}
      ${Object.keys(component.props || {}).slice(0, 2).map((k) => `${k}="default"`).join('\n      ')}
    />
  );
};`;
  }, [component]);

  if (loading) {
    return (
      <div className="content-wrapper" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <div
          style={{
            width: '2.5rem',
            height: '2.5rem',
            border: `3px solid ${themeTokens.colors.border}`,
            borderTopColor: themeTokens.colors.primary,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1.25rem',
          }}
        />
        <p style={{ color: themeTokens.colors.textSecondary, margin: 0 }}>
          Loading component specification...
        </p>
      </div>
    );
  }

  if (error || !component) {
    return (
      <div className="content-wrapper" style={{ padding: '6rem 0' }}>
        <ErrorState
          error={error}
          fallback="Not found"
          cardVariant="glass"
          action={
            <Button variant="primary" onClick={() => navigate('/components')}>
              &larr; Back to Directory
            </Button>
          }
        />
      </div>
    );
  }

  const isPremium = component.accessLevel === 'premium';

  return (
    <div style={{ padding: '2.5rem 0 6rem' }}>
      <div className="content-wrapper">
        {/* Navigation Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: themeTokens.typography.fontSize.xs,
          }}
        >
          <Link
            to="/components"
            style={{
              color: themeTokens.colors.textSecondary,
              transition: 'color 0.15s ease',
            }}
          >
            Components
          </Link>
          <span aria-hidden="true" style={{ color: themeTokens.colors.textMuted }}>/</span>
          <span style={{ color: themeTokens.colors.textMuted }}>{component.category}</span>
          <span aria-hidden="true" style={{ color: themeTokens.colors.textMuted }}>/</span>
          <span style={{ color: themeTokens.colors.textPrimary, fontWeight: 500 }} aria-current="page">
            {component.name}
          </span>
        </nav>

        {/* Component Header Card */}
        <Card
          variant="glass"
          padding="lg"
          style={{
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: themeTokens.spacing.lg,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1
                style={{
                  fontFamily: themeTokens.typography.fontFamily.sans,
                  fontSize: '2.25rem',
                  fontWeight: themeTokens.typography.fontWeight.bold,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  color: themeTokens.colors.textPrimary,
                }}
              >
                {component.name}
              </h1>

              <span
                className={`badge ${isPremium ? 'badge-premium' : 'badge-free'}`}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem' }}
              >
                {isPremium ? '★ Premium' : 'Free Tier'}
              </span>
            </div>

            <p
              style={{
                fontFamily: themeTokens.typography.fontFamily.sans,
                fontSize: themeTokens.typography.fontSize.base,
                color: themeTokens.colors.textSecondary,
                maxWidth: '680px',
                margin: '0 0 1rem',
                lineHeight: themeTokens.typography.lineHeight.normal,
              }}
            >
              {component.description}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                fontSize: themeTokens.typography.fontSize.xs,
                color: themeTokens.colors.textMuted,
                flexWrap: 'wrap',
              }}
            >
              <span>
                Category: <strong style={{ color: themeTokens.colors.textPrimary }}>{component.category}</strong>
              </span>
              <span>
                Version: <strong style={{ color: themeTokens.colors.textPrimary }}>v{component.version}</strong>
              </span>
              <span>
                Slug: <code style={{ color: themeTokens.colors.primary }}>{component.slug}</code>
              </span>
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={() => navigate('/components')}>
            &larr; Back to Directory
          </Button>
        </Card>

        {/* CONDITIONAL RENDER: LOCKED STATE vs TABBED SECTIONS */}
        {isLocked ? (
          /* LOCKED STATE (Explaining how premium access is obtained - intentional enterprise product state) */
          <div data-testid="locked-card">
            <Card
              variant="glass"
              padding="none"
              style={{
                borderRadius: themeTokens.radius.lg,
                overflow: 'hidden',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                background: 'radial-gradient(ellipse at 50% 0%, rgba(168, 85, 247, 0.14) 0%, rgba(24, 32, 38, 0.98) 70%)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(168, 85, 247, 0.12)',
              }}
            >
              <div style={{ padding: '3.5rem 2rem 3rem', textAlign: 'center' }}>
                {/* Glowing Premium Lock Icon Badge */}
                <div
                  style={{
                    width: '4.75rem',
                    height: '4.75rem',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(168, 85, 247, 0.12)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    boxShadow: '0 0 24px rgba(168, 85, 247, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    color: '#A855F7',
                  }}
                >
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                  </svg>
                </div>

                {/* Tier Indicator Pill */}
                <div style={{ marginBottom: '1rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.25rem 0.85rem',
                      borderRadius: themeTokens.radius.full,
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(126, 34, 206, 0.2))',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      color: '#C084FC',
                      fontSize: themeTokens.typography.fontSize.xs,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <span>★</span> Enterprise Premium Component
                  </span>
                </div>

                {/* Heading */}
                <h2
                  data-testid="locked-title"
                  style={{
                    fontFamily: themeTokens.typography.fontFamily.sans,
                    fontSize: '1.875rem',
                    fontWeight: themeTokens.typography.fontWeight.bold,
                    margin: '0 0 0.875rem',
                    color: themeTokens.colors.textPrimary,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Premium Component Access Required
                </h2>

                {/* Subtitle / Description */}
                <p
                  style={{
                    fontFamily: themeTokens.typography.fontFamily.sans,
                    fontSize: themeTokens.typography.fontSize.base,
                    color: themeTokens.colors.textSecondary,
                    maxWidth: '620px',
                    margin: '0 auto 2.25rem',
                    lineHeight: themeTokens.typography.lineHeight.relaxed,
                  }}
                >
                  {lockReason ||
                    'Full source bundles, live interactive sandboxes, and copyable AI agent prompts for this enterprise component are reserved for Premium customer accounts.'}
                </p>

                {/* How Premium Access Is Obtained Explanation Panel */}
                <div
                  style={{
                    maxWidth: '680px',
                    margin: '0 auto 2.5rem',
                    backgroundColor: 'rgba(18, 23, 27, 0.85)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: themeTokens.radius.lg,
                    padding: '1.75rem',
                    textAlign: 'left',
                    boxShadow: themeTokens.shadows.sm,
                  }}
                >
                  <h3
                    style={{
                      margin: '0 0 1.25rem',
                      fontSize: themeTokens.typography.fontSize.sm,
                      fontWeight: themeTokens.typography.fontWeight.semibold,
                      color: themeTokens.colors.textPrimary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ color: '#A855F7', fontSize: '1rem' }}>🛡️</span>
                    How Premium Access Is Provisioned
                  </h3>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '1rem',
                    }}
                  >
                    <div
                      style={{
                        padding: '1rem',
                        backgroundColor: themeTokens.colors.surface,
                        border: `1px solid ${themeTokens.colors.border}`,
                        borderRadius: themeTokens.radius.md,
                      }}
                    >
                      <div style={{ color: '#C084FC', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                        Enterprise Admin Managed
                      </div>
                      <div style={{ color: themeTokens.colors.textSecondary, fontSize: '0.75rem', lineHeight: '1.5' }}>
                        Access is provisioned by organization administrators through corporate licensing agreements.
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '1rem',
                        backgroundColor: themeTokens.colors.surface,
                        border: `1px solid ${themeTokens.colors.border}`,
                        borderRadius: themeTokens.radius.md,
                      }}
                    >
                      <div style={{ color: '#C084FC', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                        Direct Account Grant
                      </div>
                      <div style={{ color: themeTokens.colors.textSecondary, fontSize: '0.75rem', lineHeight: '1.5' }}>
                        Administrators activate licenses directly for verified enterprise customer accounts.
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '1rem',
                        backgroundColor: themeTokens.colors.surface,
                        border: `1px solid ${themeTokens.colors.border}`,
                        borderRadius: themeTokens.radius.md,
                      }}
                    >
                      <div style={{ color: '#C084FC', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                        No Automated Checkout
                      </div>
                      <div style={{ color: themeTokens.colors.textSecondary, fontSize: '0.75rem', lineHeight: '1.5' }}>
                        Tech-Inject does not process credit cards or third-party subscriptions. Entitlements are corporate-managed.
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Action Based on Auth State */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: themeTokens.spacing.md, flexWrap: 'wrap' }}>
                  {!user ? (
                    <>
                      <Button variant="primary" size="lg" onClick={() => navigate('/sign-in')}>
                        Sign In to Customer Account
                      </Button>
                      <Button variant="secondary" size="lg" onClick={() => navigate('/components')}>
                        Explore Free Components
                      </Button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
                      <div
                        style={{
                          padding: '0.875rem 1.5rem',
                          backgroundColor: 'rgba(168, 85, 247, 0.08)',
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                          borderRadius: themeTokens.radius.md,
                          color: themeTokens.colors.textPrimary,
                          fontSize: themeTokens.typography.fontSize.sm,
                          marginBottom: '1.25rem',
                          lineHeight: '1.6',
                        }}
                      >
                        Logged in as <strong style={{ color: '#C084FC' }}>{user.email}</strong> (Status: Free Tier). Contact your system administrator to activate your organization&rsquo;s premium license.
                      </div>
                      <Button variant="secondary" size="md" onClick={() => navigate('/components')}>
                        &larr; Return to Component Catalogue
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          /* UNLOCKED TABBED SECTIONS */
          <div data-testid="unlocked-tabs-panel">
            <h2
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
            >
              Component Specifications and Integration Details
            </h2>

            {/* Tabs Navigation Bar */}
            <div
              role="tablist"
              aria-label="Component sections"
              className="tab-nav-strip"
            >
              {tabs.map((tab, idx) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    role="tab"
                    type="button"
                    className="tab-button"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    tabIndex={isActive ? 0 : -1}
                    data-testid={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  >
                    <span className="tab-icon" aria-hidden="true">
                      {tabIcons[tab.id]}
                    </span>
                    <span>{tab.label}</span>
                    {isActive && <span className="tab-active-indicator" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            {/* Tab Panel Content */}
            <div
              role="tabpanel"
              id={`panel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
              tabIndex={0}
              className="tab-panel-container"
            >
              {/* TAB 1: PREVIEW */}
              {activeTab === 'preview' && (
                <LiveComponentPreview component={component} />
              )}

              {/* TAB 2: PROPS & USAGE DOCS */}
              {activeTab === 'props' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <Card variant="surface" padding="none">
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${themeTokens.colors.border}` }}>
                      <CardTitle>Props Specification</CardTitle>
                      <CardDescription>
                        Full type definition validated against @tech-inject/types.
                      </CardDescription>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ background: themeTokens.colors.backgroundSubtle, color: themeTokens.colors.textMuted, borderBottom: `1px solid ${themeTokens.colors.border}` }}>
                            <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>Prop</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>Type</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>Default</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>Required</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(component.props || {}).length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: themeTokens.colors.textMuted }}>
                                Standard React component props apply.
                              </td>
                            </tr>
                          ) : (
                            Object.entries(component.props || {}).map(([key, prop]: [string, any]) => (
                              <tr key={key} style={{ borderBottom: `1px solid ${themeTokens.colors.border}` }}>
                                <td style={{ padding: '0.875rem 1.5rem', fontFamily: themeTokens.typography.fontFamily.mono, color: themeTokens.colors.primary, fontWeight: 600 }}>
                                  {prop.name || key}
                                </td>
                                <td style={{ padding: '0.875rem 1.5rem', fontFamily: themeTokens.typography.fontFamily.mono, color: '#93C5FD' }}>
                                  {prop.type || 'any'}
                                </td>
                                <td style={{ padding: '0.875rem 1.5rem', fontFamily: themeTokens.typography.fontFamily.mono, color: themeTokens.colors.textSecondary }}>
                                  {prop.defaultValue !== undefined ? String(prop.defaultValue) : '-'}
                                </td>
                                <td style={{ padding: '0.875rem 1.5rem' }}>
                                  {prop.required ? (
                                    <span style={{ color: themeTokens.colors.status.danger, fontWeight: 600 }}>Yes</span>
                                  ) : (
                                    <span style={{ color: themeTokens.colors.textMuted }}>No</span>
                                  )}
                                </td>
                                <td style={{ padding: '0.875rem 1.5rem', color: themeTokens.colors.textSecondary }}>
                                  {prop.description || '-'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Usage Code Snippet */}
                  <Card variant="surface" padding="lg">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <CardTitle style={{ fontSize: '1rem' }}>Example Usage</CardTitle>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopy(usageCode, 'usage')}
                      >
                        {copiedKey === 'usage' ? '✓ Copied!' : 'Copy Snippet'}
                      </Button>
                    </div>
                    <pre className="code-block" style={{ margin: 0, maxWidth: '100%', overflowX: 'auto' }}>
                      <code>{usageCode}</code>
                    </pre>
                  </Card>
                </div>
              )}

              {/* TAB 3: COPY CODE */}
              {activeTab === 'code' && (
                <CopyCodeTab component={component} />
              )}

              {/* TAB 4: COPY INSTALL */}
              {activeTab === 'install' && (
                <CopyInstallTab component={component} />
              )}

              {/* TAB 5: COPY AGENT PROMPT */}
              {activeTab === 'agent' && (
                <CopyAgentPromptTab component={component} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
