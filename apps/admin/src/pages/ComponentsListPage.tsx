import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, themeTokens, ErrorMessage } from '@tech-inject/ui-theme';
import { apiClient } from '../services/api';
import type { Component, ComponentAccessLevel, ComponentStatus } from '@tech-inject/types';

export const ComponentsListPage: React.FC = () => {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ComponentStatus>('all');
  const [accessFilter, setAccessFilter] = useState<'all' | ComponentAccessLevel>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchComponents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<any>('/admin/components');
      const data = res.data;
      const list = data?.data?.components || data?.components || (Array.isArray(data) ? data : []);
      setComponents(list);
    } catch (err: any) {
      setError(err.message || 'Something went wrong, please try again');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const handleTogglePublish = async (comp: Component) => {
    const targetIdentifier = comp.id || comp.slug;
    setActionLoadingId(targetIdentifier);
    const isCurrentlyPublished = comp.status === 'published';
    const endpoint = isCurrentlyPublished ? 'unpublish' : 'publish';
    const nextStatus: ComponentStatus = isCurrentlyPublished ? 'draft' : 'published';

    try {
      const res = await apiClient.post<any>(`/admin/components/${targetIdentifier}/${endpoint}`);
      const updated = res.data;
      const updatedComp = updated?.data?.component || updated?.component;
      setComponents((prev) =>
        prev.map((c) =>
          (c.id && c.id === comp.id) || c.slug === comp.slug
            ? updatedComp || { ...c, status: nextStatus }
            : c
        )
      );
      setFeedbackMessage(
        `Component "${comp.name}" ${nextStatus === 'published' ? 'published to catalogue' : 'moved to draft'}.`
      );
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || `Failed to ${endpoint} component.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = components.filter((c) => {
    const query = search.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(query) ||
      c.slug.toLowerCase().includes(query) ||
      (c.category && c.category.toLowerCase().includes(query));
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesAccess = accessFilter === 'all' || c.accessLevel === accessFilter;
    return matchesSearch && matchesStatus && matchesAccess;
  });

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem', color: themeTokens.colors.textPrimary }}>
            Components Directory
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: themeTokens.colors.textSecondary }}>
            Manage registered components (all drafts and published), publication status, and tier access levels.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" size="sm" onClick={fetchComponents}>
            Refresh
          </Button>
          <Link to="/components/new">
            <Button variant="primary" size="sm" data-testid="new-component-button">
              + New Component
            </Button>
          </Link>
        </div>
      </div>

      {/* Success Feedback Alert */}
      {feedbackMessage && (
        <div
          data-testid="feedback-alert"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '6px',
            color: '#34D399',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
          }}
        >
          ✓ {feedbackMessage}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <ErrorMessage
          data-testid="components-error"
          error={error}
          onRetry={fetchComponents}
          retryLabel="Retry"
          retryTestId="retry-components-btn"
          style={{ marginBottom: '1.25rem' }}
        />
      )}

      {/* Filter and Search Controls */}
      <Card variant="surface" padding="md" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, slug, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="search-input"
          style={{ flex: 1, minWidth: '220px' }}
        />

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', color: themeTokens.colors.textSecondary, marginRight: '0.25rem' }}>Status:</span>
          {(['all', 'published', 'draft'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              data-testid={`filter-status-${st}`}
              style={{
                padding: '0.45rem 0.75rem',
                minHeight: '2.375rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: statusFilter === st ? themeTokens.colors.primary : themeTokens.colors.border,
                backgroundColor: statusFilter === st ? themeTokens.colors.backgroundSubtle : 'transparent',
                color: statusFilter === st ? themeTokens.colors.primary : themeTokens.colors.textSecondary,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Access Level Filter */}
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', color: themeTokens.colors.textSecondary, marginRight: '0.25rem' }}>Tier:</span>
          {(['all', 'free', 'premium'] as const).map((acc) => (
            <button
              key={acc}
              type="button"
              onClick={() => setAccessFilter(acc)}
              data-testid={`filter-access-${acc}`}
              style={{
                padding: '0.45rem 0.75rem',
                minHeight: '2.375rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: accessFilter === acc ? themeTokens.colors.primary : themeTokens.colors.border,
                backgroundColor: accessFilter === acc ? themeTokens.colors.backgroundSubtle : 'transparent',
                color: accessFilter === acc ? themeTokens.colors.primary : themeTokens.colors.textSecondary,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {acc}
            </button>
          ))}
        </div>
      </Card>

      {/* Components Table */}
      <Card variant="surface" padding="none">
        {loading ? (
          <div
            data-testid="components-loading"
            style={{ padding: '3.5rem', textAlign: 'center', color: themeTokens.colors.textSecondary }}
          >
            <div
              style={{
                width: '2rem',
                height: '2rem',
                border: `3px solid ${themeTokens.colors.border}`,
                borderTopColor: themeTokens.colors.primary,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 1rem',
              }}
            />
            Loading components specification...
          </div>
        ) : filtered.length === 0 ? (
          <div
            data-testid="components-empty"
            style={{ padding: '3rem', textAlign: 'center', color: themeTokens.colors.textSecondary }}
          >
            No components found matching your filter criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Category</th>
                  <th>Version</th>
                  <th>Access Level</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((comp) => {
                  const isPub = comp.status === 'published';
                  const isPrem = comp.accessLevel === 'premium';
                  const identifier = comp.id || comp.slug;
                  const isOperating = actionLoadingId === identifier;

                  return (
                    <tr key={identifier} data-testid={`row-${comp.slug}`}>
                      <td>
                        <div style={{ fontWeight: 600, color: themeTokens.colors.textPrimary }}>{comp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: themeTokens.colors.textMuted }}>{comp.slug}</div>
                      </td>
                      <td>{comp.category}</td>
                      <td>
                        <code style={{ fontSize: '0.8125rem', color: themeTokens.colors.primary }}>v{comp.version}</code>
                      </td>
                      <td>
                        <span
                          className={`badge ${isPrem ? 'badge-warning' : 'badge-info'}`}
                          data-testid={`access-${comp.slug}`}
                        >
                          {isPrem ? '★ Premium' : 'Free Tier'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${isPub ? 'badge-success' : 'badge-secondary'}`}
                          data-testid={`status-${comp.slug}`}
                        >
                          {isPub ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          <Link to={`/components/${identifier}/edit`}>
                            <Button variant="outline" size="sm" style={{ minHeight: '2.375rem', minWidth: '4.25rem' }} data-testid={`edit-${comp.slug}`}>
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant={isPub ? 'secondary' : 'primary'}
                            size="sm"
                            disabled={isOperating}
                            data-testid={`toggle-publish-${comp.slug}`}
                            onClick={() => handleTogglePublish(comp)}
                            style={{ minHeight: '2.375rem', minWidth: '5.25rem' }}
                          >
                            {isOperating
                              ? 'Saving...'
                              : isPub
                              ? 'Unpublish'
                              : 'Publish'}
                          </Button>
                        </div>
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
