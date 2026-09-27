import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { themeTokens, ErrorMessage, getFriendlyErrorMessage } from '@tech-inject/ui-theme';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SignUpPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    setLoading(true);

    try {
      // Store session via httpOnly cookie, credentials: 'include' ensures cookie handling
      const res = await apiClient.post<any>('/auth/register', {
        email: trimmedEmail,
        password,
      });
      const data = res.data;

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
        // Fallback: direct to sign in if response didn't supply user object
        navigate('/sign-in');
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again with a different email.';
      setError(errMsg);
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
              Create an Account
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: themeTokens.colors.textSecondary }}>
              Join Tech-Inject to access and preview all UI components.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <ErrorMessage
              error={error}
              message={getFriendlyErrorMessage(error, undefined, 'Registration failed. Please check your details.')}
              style={{ marginBottom: '1.25rem' }}
            />
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label
                htmlFor="signup-email"
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
                id="signup-email"
                type="email"
                required
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="signup-password"
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
                id="signup-password"
                type="password"
                required
                className="form-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <span
                style={{
                  display: 'block',
                  marginTop: '0.25rem',
                  fontSize: '0.75rem',
                  color: themeTokens.colors.textMuted,
                }}
              >
                Must be at least 6 characters
              </span>
            </div>

            <div>
              <label
                htmlFor="signup-confirm-password"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: themeTokens.colors.textSecondary,
                  marginBottom: '0.375rem',
                }}
              >
                Confirm Password
              </label>
              <input
                id="signup-confirm-password"
                type="password"
                required
                className="form-input"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Switch to Sign In */}
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
                Already have an account?{' '}
              </span>
              <Link
                to="/sign-in"
                style={{
                  color: themeTokens.colors.primary,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Sign In
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
