import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { themeTokens, ErrorMessage, getFriendlyErrorMessage } from '@tech-inject/ui-theme';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Store session via httpOnly cookie, credentials: 'include' ensures cookie handling
      // Strictly NO localStorage tokens are set!
      const res = await apiClient.post<any>('/auth/login', { email, password });
      const data = res.data;

      const token = data?.data?.token || data?.token;
      if (token && typeof localStorage !== 'undefined') {
        localStorage.setItem('tech_inject_auth_token', token);
      }

      const u = data?.data?.user || data?.user;
      if (u) {
        login({
          id: u._id || u.id || '',
          email: u.email,
          isAdmin: Boolean(u.isAdmin),
          isPremium: Boolean(u.isPremium),
        });
        navigate('/components');
      } else {
        setError('Unexpected authentication response. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '4rem 0 6rem' }}>
      <div className="content-wrapper" style={{ maxWidth: '440px' }}>
        <div
          className="glass-panel"
          style={{
            padding: '2.5rem',
            border: `1px solid ${themeTokens.colors.border}`,
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: themeTokens.colors.textPrimary,
                margin: '0 0 0.5rem',
              }}
            >
              Sign In to Tech-Inject
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: themeTokens.colors.textSecondary }}>
              Access component source bundles and premium features.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <ErrorMessage
              error={error}
              message={getFriendlyErrorMessage(error, undefined, 'Authentication failed. Please verify credentials.')}
              style={{ marginBottom: '1.25rem' }}
            />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label
                htmlFor="auth-email"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: themeTokens.colors.textSecondary,
                  marginBottom: '0.375rem',
                }}
              >
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: themeTokens.colors.textSecondary,
                  marginBottom: '0.375rem',
                }}
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: `1px solid ${themeTokens.colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              textAlign: 'center',
              fontSize: '0.8125rem',
            }}
          >
            <div>
              <span style={{ color: themeTokens.colors.textSecondary }}>
                Don't have an account?{' '}
              </span>
              <Link
                to="/sign-up"
                style={{
                  color: themeTokens.colors.primary,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Sign Up
              </Link>
            </div>

            <Link to="/components" style={{ color: themeTokens.colors.textMuted, textDecoration: 'none' }}>
              &larr; Return to Directory
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
