import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { themeTokens } from '@tech-inject/ui-theme';

export const RequireAdmin: React.FC = () => {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: themeTokens.colors.background,
          color: themeTokens.colors.textSecondary,
          fontFamily: themeTokens.typography.fontFamily.sans,
        }}
      >
        <div
          style={{
            width: '2.25rem',
            height: '2.25rem',
            border: `3px solid ${themeTokens.colors.border}`,
            borderTopColor: themeTokens.colors.primary,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '1rem',
          }}
        />
        <p style={{ margin: 0, fontSize: '0.875rem' }}>Verifying administrative session...</p>
      </div>
    );
  }

  if (!admin || !admin.isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
