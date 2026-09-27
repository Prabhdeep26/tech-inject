import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  themeTokens,
} from '@tech-inject/ui-theme';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    {
      step: '01',
      title: 'Browse',
      subtitle: 'Curated Component Directory',
      description:
        'Discover production-ready, type-safe UI components organized by category, accessibility tier, and status. Filter effortlessly between Free and Premium components.',
      badge: 'Step 1',
      badgeColor: themeTokens.colors.primary,
    },
    {
      step: '02',
      title: 'Preview',
      subtitle: 'Live Interactive Sandbox',
      description:
        'Inspect props schemas, toggle interactive playground controls, and evaluate real-time states before pulling code into your application or workflow.',
      badge: 'Step 2',
      badgeColor: themeTokens.colors.status.info,
    },
    {
      step: '03',
      title: 'Copy / Install / Agent-Integrate',
      subtitle: 'Instant Delivery into Codebases',
      description:
        'Extract standalone TypeScript bundles, install directly through monorepo workspaces, or let autonomous AI agents inject components programmatically via CLI & MCP tools.',
      badge: 'Step 3',
      badgeColor: themeTokens.colors.status.warning,
    },
  ];

  return (
    <div style={{ paddingBottom: themeTokens.spacing['2xl'] }}>
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: '5rem 0 4rem',
          borderBottom: `1px solid ${themeTokens.colors.border}`,
          background: `radial-gradient(ellipse at 50% 15%, rgba(0, 181, 98, 0.12) 0%, rgba(11, 15, 18, 0) 70%)`,
        }}
      >
        <div className="content-wrapper" style={{ textAlign: 'center' }}>
          {/* Eyebrow Label */}
          <div style={{ display: 'inline-flex', marginBottom: '1.25rem' }}>
            <span
              style={{
                fontFamily: themeTokens.typography.fontFamily.sans,
                fontSize: themeTokens.typography.fontSize.xs,
                fontWeight: themeTokens.typography.fontWeight.semibold,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: themeTokens.colors.primary,
                backgroundColor: themeTokens.colors.accentSubtle,
                border: `1px solid rgba(0, 181, 98, 0.35)`,
                padding: '0.35rem 0.85rem',
                borderRadius: themeTokens.radius.full,
              }}
            >
              Enterprise Component System
            </span>
          </div>

          {/* Hero Headline */}
          <h1
            style={{
              fontFamily: themeTokens.typography.fontFamily.sans,
              fontSize: '3.25rem',
              fontWeight: themeTokens.typography.fontWeight.bold,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              margin: '0 auto 1.25rem',
              maxWidth: '840px',
              color: themeTokens.colors.textPrimary,
            }}
          >
            Engineered UI Components for Modern Web &amp;{' '}
            <span
              style={{
                color: themeTokens.colors.primary,
                textShadow: '0 0 24px rgba(0, 181, 98, 0.35)',
              }}
            >
              AI Agents
            </span>
          </h1>

          {/* Hero Subtitle */}
          <p
            style={{
              fontFamily: themeTokens.typography.fontFamily.sans,
              fontSize: themeTokens.typography.fontSize.lg,
              color: themeTokens.colors.textSecondary,
              maxWidth: '660px',
              margin: '0 auto 2.5rem',
              lineHeight: themeTokens.typography.lineHeight.relaxed,
            }}
          >
            A high-performance component library designed for human developers and autonomous AI agents. Built with React 19, strict TypeScript validation, unified design tokens, and role-based access control.
          </p>

          {/* Primary Call to Action into /components */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: themeTokens.spacing.md,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/components')}
              rightIcon={
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              }
            >
              Browse Catalogue
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/sign-in')}
            >
              Sign In to Account
            </Button>
          </div>
        </div>
      </section>

      {/* "How It Works" Section */}
      <section style={{ padding: '4.5rem 0' }}>
        <div className="content-wrapper">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span
              style={{
                fontSize: themeTokens.typography.fontSize.xs,
                fontWeight: themeTokens.typography.fontWeight.semibold,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: themeTokens.colors.primary,
              }}
            >
              Workflow
            </span>
            <h2
              style={{
                fontFamily: themeTokens.typography.fontFamily.sans,
                fontSize: '2rem',
                fontWeight: themeTokens.typography.fontWeight.bold,
                letterSpacing: '-0.02em',
                margin: '0.5rem 0 0.75rem',
                color: themeTokens.colors.textPrimary,
              }}
            >
              How It Works
            </h2>
            <p
              style={{
                fontFamily: themeTokens.typography.fontFamily.sans,
                fontSize: themeTokens.typography.fontSize.base,
                color: themeTokens.colors.textSecondary,
                maxWidth: '560px',
                margin: '0 auto',
                lineHeight: themeTokens.typography.lineHeight.normal,
              }}
            >
              Three frictionless steps from discovery to production-ready integration in your code base.
            </p>
          </div>

          {/* Step Cards Grid using ui-theme Card primitives */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: themeTokens.spacing.xl,
            }}
          >
            {steps.map((item) => (
              <Card
                key={item.step}
                variant="surface"
                padding="lg"
                interactive
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Step Index Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: themeTokens.spacing.md,
                  }}
                >
                  <span
                    style={{
                      fontFamily: themeTokens.typography.fontFamily.mono,
                      fontSize: themeTokens.typography.fontSize.xs,
                      fontWeight: themeTokens.typography.fontWeight.semibold,
                      color: item.badgeColor,
                      backgroundColor: themeTokens.colors.backgroundSubtle,
                      padding: '0.25rem 0.6rem',
                      borderRadius: themeTokens.radius.sm,
                      border: `1px solid ${themeTokens.colors.border}`,
                    }}
                  >
                    {item.badge}
                  </span>
                  <span
                    style={{
                      fontFamily: themeTokens.typography.fontFamily.mono,
                      fontSize: '1.25rem',
                      fontWeight: themeTokens.typography.fontWeight.bold,
                      color: themeTokens.colors.textSecondary,
                    }}
                  >
                    {item.step}
                  </span>
                </div>

                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.subtitle}</CardDescription>
                </CardHeader>

                <CardContent style={{ flexGrow: 1, lineHeight: themeTokens.typography.lineHeight.relaxed }}>
                  {item.description}
                </CardContent>

                <CardFooter>
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => navigate('/components')}
                    rightIcon={<span>&rarr;</span>}
                  >
                    {item.title === 'Browse'
                      ? 'Explore Directory'
                      : item.title === 'Preview'
                      ? 'Try Component Sandbox'
                      : 'Integrate Components'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Card Banner using ui-theme Card & Button primitives */}
      <section style={{ padding: '0 0 3rem' }}>
        <div className="content-wrapper">
          <Card
            variant="glass"
            padding="xl"
            style={{
              textAlign: 'center',
              border: `1px solid ${themeTokens.colors.accentMuted}`,
              background: `linear-gradient(180deg, rgba(24, 32, 38, 0.8) 0%, rgba(18, 23, 27, 0.95) 100%)`,
            }}
          >
            <h3
              style={{
                fontFamily: themeTokens.typography.fontFamily.sans,
                fontSize: '1.75rem',
                fontWeight: themeTokens.typography.fontWeight.bold,
                margin: '0 0 0.75rem',
                color: themeTokens.colors.textPrimary,
              }}
            >
              Ready to Accelerate Your UI Development?
            </h3>
            <p
              style={{
                fontFamily: themeTokens.typography.fontFamily.sans,
                fontSize: themeTokens.typography.fontSize.base,
                color: themeTokens.colors.textSecondary,
                maxWidth: '580px',
                margin: '0 auto 1.75rem',
                lineHeight: themeTokens.typography.lineHeight.relaxed,
              }}
            >
              Jump into the component catalogue to inspect live interactive demos, props specifications, and modular bundle downloads.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: themeTokens.spacing.md, flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/components')}
              >
                Get Started in /components &rarr;
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};
