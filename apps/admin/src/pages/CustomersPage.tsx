import React, { useState, useEffect } from 'react';
import { Card, Button, themeTokens, ErrorMessage } from '@tech-inject/ui-theme';
import { apiClient } from '../services/api';
import type { User } from '@tech-inject/types';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Optimistic UI & Action Feedback states
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, 'granting' | 'revoking'>>({});

  // Filtering & Search
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'premium'>('all');

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<any>('/admin/customers');
      const data = res.data;
      const list = data?.data?.customers || data?.customers || (Array.isArray(data) ? data : []);
      setCustomers(list);
    } catch (err: any) {
      setError(err.message || 'Something went wrong, please try again');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  /**
   * Optimistically updates customer entitlement and rolls back on failure
   */
  const handleUpdateEntitlement = async (customer: User, targetPremium: boolean) => {
    const customerId = customer.id || (customer as any)._id;
    const previousIsPremium = customer.isPremium;

    if (previousIsPremium === targetPremium) return;

    // Reset banner notifications
    setActionError(null);
    setActionSuccess(null);

    // 1. OPTIMISTIC UPDATE: Update UI state immediately before network call
    setCustomers((prev) =>
      prev.map((c) => {
        const cId = c.id || (c as any)._id;
        return cId === customerId ? { ...c, isPremium: targetPremium } : c;
      })
    );

    // Mark pending state for this specific user
    setPendingUpdates((prev) => ({
      ...prev,
      [customerId]: targetPremium ? 'granting' : 'revoking',
    }));

    const endpoint = targetPremium
      ? `/admin/customers/${customerId}/grant-premium`
      : `/admin/customers/${customerId}/revoke-premium`;

    try {
      const res = await apiClient.post<any>(endpoint, {
        email: customer.email,
        note: targetPremium ? 'Upgraded to premium tier' : 'Downgraded to free tier',
      });
      const data = res.data;

      // Reconcile with updated customer returned by server if available
      if (data.data?.customer) {
        setCustomers((prev) =>
          prev.map((c) => {
            const cId = c.id || (c as any)._id;
            return cId === customerId ? { ...c, ...data.data.customer } : c;
          })
        );
      }

      setActionSuccess(
        targetPremium
          ? `✓ Premium status successfully granted to ${customer.email}.`
          : `✓ Premium status successfully revoked from ${customer.email}.`
      );
    } catch (err: any) {
      // 2. ERROR ROLLBACK: Revert customer state back to previous entitlement
      setCustomers((prev) =>
        prev.map((c) => {
          const cId = c.id || (c as any)._id;
          return cId === customerId ? { ...c, isPremium: previousIsPremium } : c;
        })
      );

      const errorMessage =
        err.message || `An error occurred while updating entitlement for ${customer.email}.`;
      setActionError(`Action Failed: ${errorMessage} (Changes rolled back)`);
    } finally {
      // Clear pending status
      setPendingUpdates((prev) => {
        const next = { ...prev };
        delete next[customerId];
        return next;
      });
    }
  };

  // Filter customers by search keyword and tier
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.email.toLowerCase().includes(search.toLowerCase().trim());
    const matchesTier =
      tierFilter === 'all'
        ? true
        : tierFilter === 'premium'
        ? c.isPremium
        : !c.isPremium;
    return matchesSearch && matchesTier;
  });

  const totalCount = customers.length;
  const premiumCount = customers.filter((c) => c.isPremium).length;
  const freeCount = totalCount - premiumCount;

  return (
    <div data-testid="customers-page">
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              margin: '0 0 0.25rem',
              color: themeTokens.colors.textPrimary,
            }}
          >
            Customer Entitlements
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: themeTokens.colors.textSecondary }}>
            List customer accounts and provision or revoke access to premium component tiers with optimistic synchronization.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCustomers}
          disabled={loading}
          data-testid="refresh-button"
        >
          {loading ? 'Refreshing...' : 'Refresh List'}
        </Button>
      </div>

      {/* Global Fetch Error Banner */}
      {error && (
        <ErrorMessage
          data-testid="fetch-error-banner"
          error={error}
          onRetry={fetchCustomers}
          retryLabel="Retry"
          style={{ marginBottom: '1.25rem' }}
        />
      )}

      {/* Action Error / Rollback Alert Banner */}
      {actionError && (
        <ErrorMessage
          data-testid="rollback-error-banner"
          message={actionError}
          onDismiss={() => setActionError(null)}
          style={{ marginBottom: '1.25rem' }}
        />
      )}

      {/* Action Success Alert Banner */}
      {actionSuccess && (
        <div
          data-testid="action-success-banner"
          style={{
            padding: '0.875rem 1rem',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '6px',
            color: '#34D399',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#34D399',
              cursor: 'pointer',
              fontSize: '1.2rem',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <Card variant="surface" padding="md">
          <div style={{ fontSize: '0.75rem', color: themeTokens.colors.textMuted, textTransform: 'uppercase' }}>
            Total Customers
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: themeTokens.colors.textPrimary, marginTop: '0.25rem' }}>
            {totalCount}
          </div>
        </Card>

        <Card variant="surface" padding="md">
          <div style={{ fontSize: '0.75rem', color: themeTokens.colors.textMuted, textTransform: 'uppercase' }}>
            Premium Tier
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#34D399', marginTop: '0.25rem' }}>
            {premiumCount}
          </div>
        </Card>

        <Card variant="surface" padding="md">
          <div style={{ fontSize: '0.75rem', color: themeTokens.colors.textMuted, textTransform: 'uppercase' }}>
            Free Tier
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: themeTokens.colors.textSecondary, marginTop: '0.25rem' }}>
            {freeCount}
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card variant="surface" padding="md" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search customers by email address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="search-input"
              style={{ width: '100%', minHeight: '2.5rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['all', 'premium', 'free'] as const).map((tier) => (
              <Button
                key={tier}
                type="button"
                variant={tierFilter === tier ? 'primary' : 'ghost'}
                size="md"
                onClick={() => setTierFilter(tier)}
                data-testid={`filter-${tier}`}
                style={{ minHeight: '2.375rem', padding: '0.45rem 0.875rem' }}
              >
                {tier === 'all'
                  ? `All (${totalCount})`
                  : tier === 'premium'
                  ? `Premium (${premiumCount})`
                  : `Free (${freeCount})`}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <Card variant="surface" padding="none">
        {loading ? (
          <div
            data-testid="loading-indicator"
            style={{ padding: '3.5rem', textAlign: 'center', color: themeTokens.colors.textSecondary }}
          >
            Loading customer accounts from database...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div
            data-testid="empty-customers-message"
            style={{ padding: '3.5rem', textAlign: 'center', color: themeTokens.colors.textSecondary }}
          >
            No customers match the active search or filter criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer Email</th>
                  <th>Account ID</th>
                  <th>Current Status</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'right' }}>Entitlement Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => {
                  const custId = cust.id || (cust as any)._id;
                  const isPrem = cust.isPremium;
                  const pendingAction = pendingUpdates[custId];
                  const isPending = Boolean(pendingAction);

                  return (
                    <tr key={custId} data-testid={`customer-row-${custId}`}>
                      <td>
                        <strong
                          data-testid={`customer-email-${custId}`}
                          style={{ color: themeTokens.colors.textPrimary }}
                        >
                          {cust.email}
                        </strong>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.75rem', color: themeTokens.colors.textMuted }}>
                          {custId}
                        </code>
                      </td>
                      <td>
                        <span
                          data-testid={`customer-status-${custId}`}
                          className={`badge ${isPrem ? 'badge-success' : 'badge-secondary'}`}
                          style={{
                            fontWeight: 600,
                            backgroundColor: isPrem ? 'rgba(16, 185, 129, 0.15)' : undefined,
                            color: isPrem ? '#34D399' : undefined,
                            border: isPrem ? '1px solid rgba(16, 185, 129, 0.3)' : undefined,
                          }}
                        >
                          {isPrem ? '★ Premium Tier' : 'Free Tier'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: themeTokens.colors.textSecondary }}>
                          {cust.isAdmin ? 'Admin' : 'Customer'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isPrem ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={isPending}
                            data-testid={`revoke-premium-btn-${custId}`}
                            onClick={() => handleUpdateEntitlement(cust, false)}
                            style={{ minWidth: '120px', minHeight: '2.375rem' }}
                          >
                            {pendingAction === 'revoking' ? 'Revoking...' : 'Revoke Premium'}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={isPending}
                            data-testid={`grant-premium-btn-${custId}`}
                            onClick={() => handleUpdateEntitlement(cust, true)}
                            style={{ minWidth: '120px', minHeight: '2.375rem' }}
                          >
                            {pendingAction === 'granting' ? 'Granting...' : 'Grant Premium'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
