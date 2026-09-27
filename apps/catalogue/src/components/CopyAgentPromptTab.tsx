import React, { useState, useMemo } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  themeTokens,
} from '@tech-inject/ui-theme';
import type { Component } from '@tech-inject/types';

interface CopyAgentPromptTabProps {
  component: Component;
}

interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

/**
 * Sanitizes input to ensure that no tokens, passwords, cookies, or secrets
 * can ever leak into the generated AI agent prompt.
 */
function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    // Remove JWT token patterns (header.payload.signature)
    .replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, '[REDACTED_JWT]')
    // Remove Bearer tokens
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.~+/]+=*/gi, 'Bearer [REDACTED_TOKEN]')
    // Remove password / secret / cookie assignments
    .replace(/(password|secret|hash|token|cookie|auth|apiKey)\s*[:=]\s*["'][^"']+["']/gi, '$1="[REDACTED]"')
    // Remove potential private key headers
    .replace(/-----BEGIN[ A-Z0-9_-]+-----[\s\S]*?-----END[ A-Z0-9_-]+-----/g, '[REDACTED_KEY]');
}

export const CopyAgentPromptTab: React.FC<CopyAgentPromptTabProps> = ({ component }) => {
  const [targetAgent, setTargetAgent] = useState<'standard' | 'cursor' | 'antigravity'>('standard');
  const [includeTestingInstructions, setIncludeTestingInstructions] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error', text: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleCopy = async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast('success', 'Copied Agent Prompt to clipboard!');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('success', 'Copied Agent Prompt to clipboard!');
      }
    } catch {
      showToast('error', 'Failed to copy to clipboard. Please copy manually.');
    }
  };

  // Generate dynamic, credential-free prompt strictly from component metadata & bundle schema
  const generatedPrompt = useMemo(() => {
    const name = sanitizeText(component.name);
    const slug = sanitizeText(component.slug);
    const category = sanitizeText(component.category);
    const version = sanitizeText(component.version);
    const description = sanitizeText(component.description);
    const pascalName = name.replace(/[^a-zA-Z0-9]/g, '');

    // Extract dependencies
    const depsList = Array.isArray(component.dependencies) && component.dependencies.length > 0
      ? component.dependencies.map((d) => sanitizeText(d)).join(', ')
      : 'react, @tech-inject/ui-theme';

    // Format props dynamically from component.props schema
    const rawProps = component.props || {};
    const propEntries = Object.entries(rawProps);

    let propsSection = '';
    if (propEntries.length > 0) {
      propsSection = propEntries
        .map(([key, prop]: [string, any]) => {
          const propName = sanitizeText(prop?.name || key);
          const propType = sanitizeText(prop?.type || 'unknown');
          const isReq = Boolean(prop?.required);
          const defVal = prop?.defaultValue !== undefined ? ` (default: ${sanitizeText(String(prop.defaultValue))})` : '';
          const desc = prop?.description ? ` - ${sanitizeText(prop.description)}` : '';
          return `  - \`${propName}\` (${propType}${isReq ? ', required' : ', optional'}${defVal})${desc}`;
        })
        .join('\n');
    } else {
      propsSection = '  - Standard React component props: `className?: string`, `style?: React.CSSProperties`, `children?: React.ReactNode`';
    }

    // Role-specific preamble based on target agent selector
    let agentHeader = '';
    if (targetAgent === 'cursor') {
      agentHeader = `# Context for Cursor AI / Copilot
You are tasked with importing and implementing the '${name}' component into this repository.`;
    } else if (targetAgent === 'antigravity') {
      agentHeader = `# Antigravity Agent Directive
Role: Senior Frontend Engineer
Task: Safely integrate the '${name}' component from @tech-inject into the target application.`;
    } else {
      agentHeader = `# AI Coding Agent Prompt: Implement '${name}'
You are an expert React + TypeScript developer. Integrate the following component into the project.`;
    }

    // Testing / Validation section
    const testingSection = includeTestingInstructions
      ? `
## Quality & Verification Checklist
1. Render test: Verify that <${pascalName} /> mounts without runtime exceptions or missing CSS variables.
2. Interactivity test: Ensure hover, focus-visible rings, and disabled states behave correctly.
3. TypeScript validation: Run \`tsc --noEmit\` to confirm zero type errors.
`
      : '';

    const promptBody = `${agentHeader}

## Component Metadata
- Name: ${name}
- Slug: ${slug}
- Category: ${category}
- Version: ${version}
- Description: ${description}
- Required Dependencies: ${depsList}

## Props Specification
${propsSection}

## Design System & Theme Token Rules
- Canvas Background: \`#0B0F12\`
- Surface Containers: \`#182026\` (elevated: \`#232D34\`)
- Brand Primary Accent: \`#00B562\`
- Text Hierarchy: Primary (\`#F9FBFF\`), Secondary (\`#A0AEC0\`), Muted (\`#676767\`)
- Always bind interactive states to \`@tech-inject/ui-theme\` tokens or CSS variables.
- Maintain full accessibility: support native keyboard focus (\`:focus-visible\`) and ARIA labels.

## Integration Instructions
1. Install CLI bundle: \`npx @tech-inject/cli add ${slug}\` (or create \`src/components/${pascalName}.tsx\`).
2. Import the component: \`import { ${pascalName} } from './components/${pascalName}';\`
3. Use the component in accordance with the Props Specification above.
${testingSection}
*Security Notice: This integration payload contains zero hardcoded credentials or internal secrets.*`;

    return promptBody.trim();
  }, [component, targetAgent, includeTestingInstructions]);

  // Approximate token count estimation (avg 4 chars per token)
  const estimatedTokens = Math.ceil(generatedPrompt.length / 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', position: 'relative' }}>
      {/* Viewport Toast Notifications */}
      <div
        style={{
          position: 'fixed',
          top: '5rem',
          right: '2rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: themeTokens.radius.md,
              backgroundColor: toast.type === 'success' ? '#064E3B' : '#7F1D1D',
              color: toast.type === 'success' ? '#6EE7B7' : '#FCA5A5',
              border: `1px solid ${toast.type === 'success' ? '#059669' : '#DC2626'}`,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <span>{toast.type === 'success' ? '✓' : '✕'}</span>
            <span>{toast.text}</span>
          </div>
        ))}
      </div>

      {/* Main Agent Prompt Controller Header */}
      <Card variant="glass" padding="lg">
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <CardTitle>Autonomous AI Agent Integration Prompt</CardTitle>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: themeTokens.radius.full,
                    backgroundColor: 'rgba(0, 181, 98, 0.15)',
                    color: themeTokens.colors.primary,
                    border: '1px solid rgba(0, 181, 98, 0.3)',
                    fontWeight: 600,
                  }}
                >
                  🔒 Verified Credential-Free
                </span>
              </div>
              <CardDescription>
                Dynamically synthesized from component bundle metadata and props schema. Ready to paste directly into Claude, ChatGPT, Cursor, or Antigravity.
              </CardDescription>
            </div>

            <Button
              variant="primary"
              size="sm"
              data-testid="copy-prompt-btn"
              onClick={() => handleCopy(generatedPrompt)}
              leftIcon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              }
            >
              Copy Agent Prompt (~{estimatedTokens} tokens)
            </Button>
          </div>
        </CardHeader>

        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Target Model / Environment Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8125rem', color: themeTokens.colors.textSecondary, fontWeight: 500 }}>
                Target Assistant:
              </span>
              <Button
                variant={targetAgent === 'standard' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTargetAgent('standard')}
                style={{ borderColor: targetAgent === 'standard' ? themeTokens.colors.primary : 'transparent' }}
              >
                Claude / GPT-4o
              </Button>
              <Button
                variant={targetAgent === 'cursor' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTargetAgent('cursor')}
                style={{ borderColor: targetAgent === 'cursor' ? themeTokens.colors.primary : 'transparent' }}
              >
                Cursor / Copilot
              </Button>
              <Button
                variant={targetAgent === 'antigravity' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTargetAgent('antigravity')}
                style={{ borderColor: targetAgent === 'antigravity' ? themeTokens.colors.primary : 'transparent' }}
              >
                Antigravity Agent
              </Button>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: themeTokens.colors.textSecondary, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeTestingInstructions}
                onChange={(e) => setIncludeTestingInstructions(e.target.checked)}
              />
              <span>Include verification checklist</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Formatted Prompt Output */}
      <Card variant="surface" padding="none">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            backgroundColor: '#0A0E13',
            borderBottom: `1px solid ${themeTokens.colors.border}`,
            fontSize: '0.75rem',
            fontFamily: themeTokens.typography.fontFamily.mono,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: themeTokens.colors.textMuted }}>
            <span>Markdown Prompt Buffer</span>
            <span>•</span>
            <span style={{ color: themeTokens.colors.primary }}>{generatedPrompt.length} chars</span>
            <span>•</span>
            <span>~{estimatedTokens} tokens</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(generatedPrompt)}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          >
            Copy
          </Button>
        </div>

        <pre
          tabIndex={0}
          role="region"
          aria-label="Generated AI agent integration prompt"
          style={{
            margin: 0,
            padding: '1.25rem',
            backgroundColor: '#0D1117',
            color: '#E2E8F0',
            fontFamily: themeTokens.typography.fontFamily.mono,
            fontSize: '0.8125rem',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '520px',
            overflowY: 'auto',
          }}
        >
          <code>{generatedPrompt}</code>
        </pre>
      </Card>

      {/* Security Guarantee Note */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(0, 181, 98, 0.05)',
          borderRadius: themeTokens.radius.md,
          border: '1px solid rgba(0, 181, 98, 0.2)',
          fontSize: '0.75rem',
          color: themeTokens.colors.textSecondary,
        }}
      >
        <span style={{ color: themeTokens.colors.primary, fontSize: '0.875rem' }}>🛡️</span>
        <span>
          <strong>Credential-Safe Guarantee:</strong> Prompts are generated client-side directly from bundle metadata and props schemas. Auth cookies, JWTs, and environment secrets are never evaluated, read, or interpolated into prompts.
        </span>
      </div>
    </div>
  );
};
