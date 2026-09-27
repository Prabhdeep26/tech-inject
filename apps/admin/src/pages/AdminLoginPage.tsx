import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Input, themeTokens, ErrorMessage, getFriendlyErrorMessage } from '@tech-inject/ui-theme';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AdminLoginPage: React.FC = () => {
  const { admin, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Inline field validation states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  useEffect(() => {
    if (admin && admin.isAdmin) {
      navigate(from, { replace: true });
    }
  }, [admin, navigate, from]);

  // Validation functions
  const validateEmail = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Admin email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const validatePassword = (val: string): string | null => {
    if (!val) {
      return 'Admin password is required';
    }
    return null;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (touched.email) {
      setEmailError(validateEmail(val));
    }
    if (serverError) setServerError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (touched.password) {
      setPasswordError(validatePassword(val));
    }
    if (serverError) setServerError(null);
  };

  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }));
    setPasswordError(validatePassword(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark both fields touched on submit attempt
    setTouched({ email: true, password: true });

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);

    // Prevent submission and focus first invalid field if errors exist
    if (eErr || pErr) {
      if (eErr) {
        document.getElementById('admin-email')?.focus();
      } else if (pErr) {
        document.getElementById('admin-password')?.focus();
      }
      return;
    }

    setLoading(true);
    setServerError(null);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setServerError(
        getFriendlyErrorMessage(
          res.error,
          undefined,
          res.error || 'Invalid administrative credentials.'
        )
      );
    }
  };

  return (
    <div
      className="admin-login-wrapper"
      style={{
        backgroundColor: themeTokens.colors.background,
        background: 'radial-gradient(ellipse at 50% 20%, rgba(0, 181, 98, 0.08) 0%, #0B0F12 70%)',
        maxWidth: '100%',
      }}
    >
      <Card
        variant="surface"
        padding="none"
        style={{
          maxWidth: '420px',
          width: '100%',
          border: `1px solid ${themeTokens.colors.border}`,
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 16px rgba(0, 181, 98, 0.06)',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ padding: '2rem 1.75rem' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                width: '3.25rem',
                height: '3.25rem',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${themeTokens.colors.primary}, #059669)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '1.35rem',
                fontWeight: 900,
                margin: '0 auto 0.875rem',
                boxShadow: '0 4px 16px rgba(0, 181, 98, 0.35)',
              }}
            >
              TI
            </div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                margin: '0 0 0.35rem',
                color: themeTokens.colors.textPrimary,
                fontFamily: themeTokens.typography.fontFamily.sans,
                letterSpacing: '-0.02em',
              }}
            >
              Admin Console Login
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: '0.875rem',
                color: themeTokens.colors.textSecondary,
                fontFamily: themeTokens.typography.fontFamily.sans,
              }}
            >
              Tech-Inject internal administration portal
            </p>
          </div>

          {/* Server Error Alert Banner */}
          {serverError && (
            <ErrorMessage
              data-testid="login-error-alert"
              error={serverError}
              message={serverError}
              style={{ marginBottom: '1.25rem', fontSize: '0.8125rem', padding: '0.75rem 1rem' }}
            />
          )}

          {/* Form with inline validation */}
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}
          >
            <Input
              id="admin-email"
              type="email"
              name="email"
              autoComplete="email"
              label="Admin Email"
              placeholder="admin@tech-inject.internal"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              error={touched.email ? (emailError || undefined) : undefined}
              fullWidth
              size="md"
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              }
            />

            <Input
              id="admin-password"
              type="password"
              name="password"
              autoComplete="current-password"
              label="Admin Password / Secret"
              placeholder="••••••••••••"
              value={password}
              onChange={handlePasswordChange}
              onBlur={handlePasswordBlur}
              error={touched.password ? (passwordError || undefined) : undefined}
              fullWidth
              size="md"
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              style={{ marginTop: '0.35rem', width: '100%', minHeight: '2.75rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In as Administrator'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
