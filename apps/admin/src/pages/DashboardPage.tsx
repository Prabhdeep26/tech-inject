import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, themeTokens, ErrorMessage } from '@tech-inject/ui-theme';
import { apiClient } from '../services/api';
import type { Component, User } from '@tech-inject/types';

export const DashboardPage: React.FC = () => {
  const [components, setComponents] = useState<Component[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [compRes, custRes] = await Promise.all([
        apiClient.get<any>('/admin/components'),
        apiClient.get<any>('/admin/customers'),
      ]);

      const compData = compRes.data;
      const custData = custRes.data;

      setComponents(compData?.data?.components || compData?.components || (Array.isArray(compData) ? compData : []));
      setCustomers(custData?.data?.customers || custData?.customers || (Array.isArray(custData) ? custData : []));
    } catch (err: any) {
      setError(err.message || 'Something went wrong, please try again');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalComponents = components.length;
  const publishedCount = components.filter((c) => c.status === 'published').length;
  const premiumCount = components.filter((c) => c.accessLevel === 'premium').length;
  const totalCustomers = customers.length;
  const premiumCustomers = customers.filter((c) => c.isPremium).length;

  return (
    <div data-testid="dashboard-page">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem', color: themeTokens.colors.textPrimary }}>
            Admin Dashboard
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: themeTokens.colors.textSecondary }}>
            Tech-Inject component catalogue and customer entitlement operations overview.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/components/new" tabIndex={0}>
            <Button variant="primary" size="sm" data-testid="btn-new-component">
              + New Component
            </Button>
          </Link>
          <Link to="/customers" tabIndex={0}>
            <Button variant="outline" size="sm" data-testid="btn-manage-customers">
              Manage Customers
            </Button>
          </Link>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <ErrorMessage
          data-testid="dashboard-error"
          error={error}
          onRetry={fetchData}
          retryLabel="Retry"
          retryTestId="retry-dashboard-btn"
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      {/* Loading State Skeleton */}
      {loading ? (
        <div
          data-testid="dashboard-loading"
          style={{
            padding: '3.5rem 1rem',
            textAlign: 'center',
            color: themeTokens.colors.textSecondary,
          }}
        >
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              border: `3px solid ${themeTokens.colors.border}`,
              borderTopColor: themeTokens.colors.primary,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading system operations metrics...</p>
        </div>
      ) : (
        <>
          {/* Metrics Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <Card variant="surface" padding="md">
              <div style={{ color: themeTokens.colors.textMuted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Components
              </div>
              <div
                data-testid="kpi-total-components"
                style={{ fontSize: '2rem', fontWeight: 700, color: themeTokens.colors.textPrimary, margin: '0.25rem 0' }}
              >
                {totalComponents}
              </div>
              <div style={{ fontSize: '0.75rem', color: themeTokens.colors.textSecondary }}>
                {publishedCount} Published &bull; {totalComponents - publishedCount} Drafts
              </div>
            </Card>

            <Card variant="surface" padding="md">
              <div style={{ color: themeTokens.colors.textMuted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Premium Components
              </div>
              <div
                data-testid="kpi-premium-components"
                style={{ fontSize: '2rem', fontWeight: 700, color: '#FBBF24', margin: '0.25rem 0' }}
              >
                {premiumCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: themeTokens.colors.textSecondary }}>
                Enterprise tier restricted
              </div>
            </Card>

            <Card variant="surface" padding="md">
              <div style={{ color: themeTokens.colors.textMuted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Registered Customers
              </div>
              <div
                data-testid="kpi-total-customers"
                style={{ fontSize: '2rem', fontWeight: 700, color: themeTokens.colors.primary, margin: '0.25rem 0' }}
              >
                {totalCustomers}
              </div>
              <div style={{ fontSize: '0.75rem', color: themeTokens.colors.textSecondary }}>
                {premiumCustomers} Active premium grants
              </div>
            </Card>

            <Card variant="surface" padding="md">
              <div style={{ color: themeTokens.colors.textMuted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                System Status
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: themeTokens.colors.textPrimary, margin: '0.5rem 0' }}>
                Operational
              </div>
              <div style={{ fontSize: '0.75rem', color: '#34D399' }}>
                API Gateway connected
              </div>
            </Card>
          </div>

          {/* Empty State Banner if 0 components */}
          {totalComponents === 0 && (
            <Card
              variant="surface"
              padding="lg"
              style={{
                marginBottom: '2rem',
                border: `1px dashed ${themeTokens.colors.primary}`,
                textAlign: 'center',
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem', color: themeTokens.colors.textPrimary }}>
                No Components in Catalogue
              </h3>
              <p style={{ color: themeTokens.colors.textSecondary, marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                Your registry is currently empty. Get started by registering your first React component bundle.
              </p>
              <Link to="/components/new" tabIndex={0}>
                <Button variant="primary" size="sm" data-testid="empty-cta-create">
                  Register Component
                </Button>
              </Link>
            </Card>
          )}

          {/* Quick Navigation Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <Card variant="surface" padding="lg">
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem', color: themeTokens.colors.textPrimary }}>
                Component Management
              </h2>
              <p style={{ fontSize: '0.875rem', color: themeTokens.colors.textSecondary, marginBottom: '1.25rem' }}>
                Review registered React components, upload bundles, change draft/published status, and configure tiers.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link to="/components" tabIndex={0}>
                  <Button variant="secondary" size="sm">
                    View All Components &rarr;
                  </Button>
                </Link>
                <Link to="/components/new" tabIndex={0}>
                  <Button variant="primary" size="sm">
                    Register New
                  </Button>
                </Link>
              </div>
            </Card>

            <Card variant="surface" padding="lg">
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem', color: themeTokens.colors.textPrimary }}>
                Customer Entitlements
              </h2>
              <p style={{ fontSize: '0.875rem', color: themeTokens.colors.textSecondary, marginBottom: '1.25rem' }}>
                Grant or revoke premium access for customer accounts directly with optimistic state updates.
              </p>
              <div>
                <Link to="/customers" tabIndex={0}>
                  <Button variant="secondary" size="sm">
                    Manage Customer Licenses &rarr;
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
