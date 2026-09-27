import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { themeTokens, Button } from '@tech-inject/ui-theme';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AdminLayout: React.FC = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    padding: '0.5rem 0.875rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: isActive ? 600 : 500,
    color: isActive ? themeTokens.colors.primary : themeTokens.colors.textSecondary,
    backgroundColor: isActive ? themeTokens.colors.backgroundSubtle : 'transparent',
    transition: 'all 0.15s ease',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: themeTokens.colors.background }}>
      {/* Skip to Main Content Link for Keyboard Navigation */}
      <a href="#admin-main-content" className="skip-to-content" data-testid="skip-link">
        Skip to main content
      </a>

      {/* Top Admin Header Bar */}
      <header
        role="banner"
        style={{
          borderBottom: `1px solid ${themeTokens.colors.border}`,
          backgroundColor: themeTokens.colors.surface,
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', maxWidth: '100%' }}>
          <NavLink
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              fontSize: '1.125rem',
              color: themeTokens.colors.textPrimary,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '6px',
                background: `linear-gradient(135deg, ${themeTokens.colors.primary}, #059669)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 900,
              }}
            >
              TI
            </div>
            Tech-Inject <span style={{ color: themeTokens.colors.primary, fontSize: '0.75rem', fontWeight: 600, padding: '0.1rem 0.4rem', border: `1px solid ${themeTokens.colors.primary}`, borderRadius: '4px' }}>ADMIN</span>
          </NavLink>

          <nav
            role="navigation"
            aria-label="Administrative Navigation"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              flexWrap: 'wrap',
            }}
          >
            <NavLink to="/" end style={navLinkStyle}>
              Dashboard
            </NavLink>
            <NavLink to="/components" end style={navLinkStyle}>
              Components
            </NavLink>
            <NavLink to="/components/new" style={navLinkStyle}>
              + New Component
            </NavLink>
            <NavLink to="/customers" style={navLinkStyle}>
              Customers
            </NavLink>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {admin ? (
            <>
              <span style={{ fontSize: '0.8125rem', color: themeTokens.colors.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                Logged in as <strong style={{ color: themeTokens.colors.textPrimary }}>{admin.email}</strong>
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout} data-testid="sign-out-btn">
                Sign Out
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Main Page Area */}
      <main
        id="admin-main-content"
        tabIndex={-1}
        role="main"
        style={{ flex: 1, padding: '1.5rem 1rem', maxWidth: '1200px', width: '100%', margin: '0 auto', outline: 'none', boxSizing: 'border-box' }}
      >
        <Outlet />
      </main>
    </div>
  );
};
