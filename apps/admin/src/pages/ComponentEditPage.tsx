import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { themeTokens, Card, Button, ErrorState } from '@tech-inject/ui-theme';
import { apiClient } from '../services/api';
import type { Component } from '@tech-inject/types';
import { ComponentForm } from '../components/ComponentForm';

export const ComponentEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [component, setComponent] = useState<Component | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComponent = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<any>('/admin/components');
        const data = res.data;
        const list: Component[] = data?.data?.components || data?.components || (Array.isArray(data) ? data : []);
        const found = list.find((c) => c.id === id || c.slug === id);
        if (found) {
          setComponent(found);
          return;
        }
        throw new Error('Not found');
      } catch (err: any) {
        setError(err.message || 'Not found');
      } finally {
        setLoading(false);
      }
    };

    fetchComponent();
  }, [id]);

  if (loading) {
    return (
      <div
        data-testid="edit-loading"
        style={{ padding: '4rem', textAlign: 'center', color: themeTokens.colors.textSecondary }}
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
        Loading component specification...
      </div>
    );
  }

  if (error || !component) {
    return (
      <div data-testid="edit-error" style={{ maxWidth: '640px', margin: '3rem auto' }}>
        <ErrorState
          error={error}
          title="Component Not Found"
          fallback="Not found"
          action={
            <Link to="/components">
              <Button variant="secondary" data-testid="return-components-btn">&larr; Return to Components Directory</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', paddingBottom: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        <Link to="/components" style={{ color: themeTokens.colors.textSecondary }}>
          &larr; Components
        </Link>
        <span style={{ color: themeTokens.colors.textMuted }}>/</span>
        <span style={{ color: themeTokens.colors.textPrimary, fontWeight: 500 }}>
          Edit {component.name}
        </span>
      </div>

      <ComponentForm
        mode="edit"
        componentId={component.id || id}
        initialValues={component}
        onSuccess={() => {
          navigate('/components');
        }}
      />
    </div>
  );
};
