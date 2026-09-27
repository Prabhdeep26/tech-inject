import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { themeTokens, Badge, Button } from '@tech-inject/ui-theme';

export const Navbar: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isHomeActive = isActive('/');
  const isComponentsActive = isActive('/components');
  const isSignInActive = isActive('/sign-in');
  const isSignUpActive = isActive('/sign-up');

  return (
    <header
      role="banner"
      style={{
        backgroundColor: 'rgba(11, 15, 18, 0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${themeTokens.colors.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
      }}
    >
      <div
        className="content-wrapper"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '4rem',
        }}
      >
        {/* Brand / Logo */}
        <Link
          to="/"
          onClick={closeMobileMenu}
          aria-label="TechInject Home"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: themeTokens.spacing.sm,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: themeTokens.radius.md,
              backgroundColor: themeTokens.colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: themeTokens.shadows.glow,
              flexShrink: 0,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0B0F12"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: themeTokens.typography.fontFamily.sans,
              fontSize: themeTokens.typography.fontSize.lg,
              fontWeight: themeTokens.typography.fontWeight.bold,
              color: themeTokens.colors.textPrimary,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            Tech<span style={{ color: themeTokens.colors.primary }}>Inject</span>
          </span>
        </Link>

        {/* Center Navigation Links - Desktop (pill/chip style matching admin panel) */}
        <nav
          aria-label="Main Navigation"
          className="desktop-only"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Link
            to="/"
            aria-current={isHomeActive ? 'page' : undefined}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.5rem 0.875rem',
              borderRadius: '6px',
              fontFamily: themeTokens.typography.fontFamily.sans,
              fontSize: themeTokens.typography.fontSize.sm,
              fontWeight: isHomeActive
                ? themeTokens.typography.fontWeight.semibold
                : themeTokens.typography.fontWeight.medium,
              color: isHomeActive ? themeTokens.colors.primary : themeTokens.colors.textSecondary,
              backgroundColor: isHomeActive ? themeTokens.colors.backgroundSubtle : 'transparent',
              transition: 'all 0.15s ease',
              textDecoration: 'none',
            }}
          >
            Home
          </Link>

          <Link
            to="/components"
            aria-current={isComponentsActive ? 'page' : undefined}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.5rem 0.875rem',
              borderRadius: '6px',
              fontFamily: themeTokens.typography.fontFamily.sans,
              fontSize: themeTokens.typography.fontSize.sm,
              fontWeight: isComponentsActive
                ? themeTokens.typography.fontWeight.semibold
                : themeTokens.typography.fontWeight.medium,
              color: isComponentsActive ? themeTokens.colors.primary : themeTokens.colors.textSecondary,
              backgroundColor: isComponentsActive ? themeTokens.colors.backgroundSubtle : 'transparent',
              transition: 'all 0.15s ease',
              textDecoration: 'none',
            }}
          >
            Components
          </Link>
        </nav>

        {/* Right Side / Auth & Account Area - Desktop */}
        <div
          className="desktop-only"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: themeTokens.spacing.md,
            flexShrink: 0,
          }}
        >
          {loading ? (
            <div
              style={{
                fontFamily: themeTokens.typography.fontFamily.sans,
                fontSize: themeTokens.typography.fontSize.xs,
                color: themeTokens.colors.textMuted,
              }}
            >
              Checking session...
            </div>
          ) : user ? (
            <div
              data-testid="account-status"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: themeTokens.spacing.sm,
              }}
            >
              {/* User Avatar Circle */}
              <div
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: themeTokens.radius.full,
                  backgroundColor: themeTokens.colors.surfaceElevated,
                  border: `1px solid ${user.isPremium ? themeTokens.colors.tier.premium : themeTokens.colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: themeTokens.typography.fontWeight.semibold,
                  color: user.isPremium ? themeTokens.colors.tier.premium : themeTokens.colors.primary,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>

              {/* User Email */}
              <span
                style={{
                  fontFamily: themeTokens.typography.fontFamily.sans,
                  fontSize: themeTokens.typography.fontSize.xs,
                  color: themeTokens.colors.textSecondary,
                  maxWidth: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={user.email}
              >
                {user.email}
              </span>

              {/* Entitlement Status Badge */}
              {user.isPremium ? (
                <Badge
                  variant="premium"
                  size="sm"
                  className="badge badge-premium"
                  data-testid="account-status-badge"
                  title="Account Status: Premium"
                  leftIcon={<span style={{ fontSize: '0.625rem', lineHeight: 1 }} aria-hidden="true">★</span>}
                >
                  Premium
                </Badge>
              ) : (
                <Badge
                  variant="free"
                  size="sm"
                  className="badge badge-free"
                  data-testid="account-status-badge"
                  title="Account Status: Free Tier"
                  dot
                >
                  Free Tier
                </Badge>
              )}

              {/* Sign Out Button */}
              <Button
                variant="secondary"
                size="sm"
                data-testid="sign-out-btn"
                onClick={() => logout()}
                style={{ padding: `0.35rem ${themeTokens.spacing.sm}` }}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: themeTokens.spacing.sm }}>
              <Link to="/sign-in" style={{ textDecoration: 'none' }}>
                <Button
                  variant={isSignInActive ? 'primary' : 'outline'}
                  size="sm"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/sign-up" style={{ textDecoration: 'none' }}>
                <Button
                  variant={isSignUpActive ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button (<768px) */}
        <button
          type="button"
          id="mobile-menu-toggle"
          className="mobile-only"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-menu"
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: themeTokens.radius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: themeTokens.colors.surfaceElevated,
            border: `1px solid ${themeTokens.colors.border}`,
            color: themeTokens.colors.textPrimary,
            cursor: 'pointer',
            padding: 0,
            transition: 'all 0.15s ease',
          }}
        >
          {mobileMenuOpen ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Drawer (Below 768px) */}
      {mobileMenuOpen && (
        <nav
          id="mobile-nav-menu"
          aria-label="Mobile Navigation"
          className="mobile-menu-drawer"
        >
          {/* Mobile Links with Active Route Highlighting */}
          <Link
            to="/"
            onClick={closeMobileMenu}
            aria-current={isHomeActive ? 'page' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: `${themeTokens.spacing.sm} ${themeTokens.spacing.md}`,
              fontFamily: themeTokens.typography.fontFamily.sans,
              fontSize: themeTokens.typography.fontSize.sm,
              fontWeight: isHomeActive ? 600 : 500,
              color: isHomeActive ? themeTokens.colors.primary : themeTokens.colors.textPrimary,
              backgroundColor: isHomeActive ? themeTokens.colors.accentSubtle : 'transparent',
              borderLeft: isHomeActive ? `3px solid ${themeTokens.colors.primary}` : '3px solid transparent',
              borderRadius: themeTokens.radius.sm,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Home
          </Link>

          <Link
            to="/components"
            onClick={closeMobileMenu}
            aria-current={isComponentsActive ? 'page' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: `${themeTokens.spacing.sm} ${themeTokens.spacing.md}`,
              fontFamily: themeTokens.typography.fontFamily.sans,
              fontSize: themeTokens.typography.fontSize.sm,
              fontWeight: isComponentsActive ? 600 : 500,
              color: isComponentsActive ? themeTokens.colors.primary : themeTokens.colors.textPrimary,
              backgroundColor: isComponentsActive ? themeTokens.colors.accentSubtle : 'transparent',
              borderLeft: isComponentsActive ? `3px solid ${themeTokens.colors.primary}` : '3px solid transparent',
              borderRadius: themeTokens.radius.sm,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Components
          </Link>

          {/* Account Status in Mobile Drawer */}
          <div
            style={{
              paddingTop: themeTokens.spacing.md,
              borderTop: `1px solid ${themeTokens.colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: themeTokens.spacing.md,
            }}
          >
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: themeTokens.spacing.sm }}>
                    <div
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: themeTokens.radius.full,
                        backgroundColor: themeTokens.colors.surfaceElevated,
                        border: `1px solid ${user.isPremium ? themeTokens.colors.tier.premium : themeTokens.colors.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: user.isPremium ? themeTokens.colors.tier.premium : themeTokens.colors.primary,
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    >
                      {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span
                      style={{
                        fontFamily: themeTokens.typography.fontFamily.sans,
                        fontSize: themeTokens.typography.fontSize.sm,
                        color: themeTokens.colors.textSecondary,
                        maxWidth: '160px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.email}
                    </span>
                  </div>

                  {user.isPremium ? (
                    <Badge variant="premium" size="sm" className="badge badge-premium">
                      ★ Premium
                    </Badge>
                  ) : (
                    <Badge variant="free" size="sm" className="badge badge-free" dot>
                      Free Tier
                    </Badge>
                  )}
                </div>

                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: themeTokens.spacing.sm, width: '100%' }}>
                <Link to="/sign-in" onClick={closeMobileMenu} style={{ textDecoration: 'none', width: '100%' }}>
                  <Button
                    variant={isSignInActive ? 'primary' : 'secondary'}
                    size="md"
                    fullWidth
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/sign-up" onClick={closeMobileMenu} style={{ textDecoration: 'none', width: '100%' }}>
                  <Button
                    variant={isSignUpActive ? 'primary' : 'outline'}
                    size="md"
                    fullWidth
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};
