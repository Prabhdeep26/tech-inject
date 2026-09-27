import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { themeTokens } from '@tech-inject/ui-theme';
import { ComponentForm } from '../components/ComponentForm';

export const ComponentCreatePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', paddingBottom: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        <Link to="/components" style={{ color: themeTokens.colors.textSecondary }}>
          &larr; Components
        </Link>
        <span style={{ color: themeTokens.colors.textMuted }}>/</span>
        <span style={{ color: themeTokens.colors.textPrimary, fontWeight: 500 }}>Create New Component</span>
      </div>

      <ComponentForm
        mode="create"
        onSuccess={(created) => {
          navigate('/components');
        }}
      />
    </div>
  );
};
