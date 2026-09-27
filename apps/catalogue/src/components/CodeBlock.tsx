import React from 'react';
import { Button, themeTokens } from '@tech-inject/ui-theme';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  onCopy?: () => void;
  isCopied?: boolean;
  maxHeight?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'tsx',
  filename,
  onCopy,
  isCopied,
  maxHeight = '480px',
}) => {
  // Simple token regex highlighting for TSX/JSON/CSS
  const highlightCode = (raw: string): string => {
    // Escape HTML special characters
    const escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Multi-pass regex for syntax tokens
    return escaped
      // Strings
      .replace(
        /(&quot;.*?&quot;|&#39;.*?&#39;|`[\s\S]*?`|"[^"]*"|'[^']*')/g,
        '<span style="color: #34D399;">$1</span>'
      )
      // Comments
      .replace(
        /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
        '<span style="color: #64748B; font-style: italic;">$1</span>'
      )
      // Keywords
      .replace(
        /\b(import|export|from|default|const|let|var|function|return|if|else|switch|case|break|try|catch|finally|async|await|interface|type|extends|implements|as|new|typeof|keyof)\b/g,
        '<span style="color: #A78BFA; font-weight:bold;">$1</span>'
      )
      // Types & Components
      .replace(
        /\b(React|FC|ReactNode|CSSProperties|HTMLButtonElement|Component|string|number|boolean|any|unknown|void|null|undefined|Record|Array|Promise)\b/g,
        '<span style="color: #38BDF8;">$1</span>'
      )
      // Booleans & Numbers
      .replace(
        /\b(true|false|\d+)\b/g,
        '<span style="color: #FBBF24;">$1</span>'
      )
      // JSX Tag names
      .replace(
        /(&lt;\/?[A-Z][a-zA-Z0-9]*)/g,
        '<span style="color: #F43F5E; font-weight:bold;">$1</span>'
      );
  };

  const trimmedCode = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = trimmedCode.split('\n');
  // Drop all trailing blank / whitespace-only lines
  while (rawLines.length > 0 && rawLines[rawLines.length - 1].trim() === '') {
    rawLines.pop();
  }
  const lines = rawLines;

  return (
    <div
      style={{
        borderRadius: themeTokens.radius.md,
        border: `1px solid ${themeTokens.colors.border}`,
        backgroundColor: '#0D1117',
        overflow: 'hidden',
        fontFamily: themeTokens.typography.fontFamily.mono,
        maxWidth: '100%',
        width: '100%',
      }}
    >
      {/* Header Bar */}
      {(filename || language || onCopy) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 1rem',
            backgroundColor: themeTokens.colors.backgroundSubtle,
            borderBottom: `1px solid ${themeTokens.colors.border}`,
            fontSize: '0.75rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, overflow: 'hidden' }}>
            {filename && (
              <span
                style={{
                  color: themeTokens.colors.textPrimary,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {filename}
              </span>
            )}
            <span
              style={{
                textTransform: 'uppercase',
                color: themeTokens.colors.textMuted,
                fontSize: '0.6875rem',
                backgroundColor: themeTokens.colors.surfaceElevated,
                padding: '0.1rem 0.4rem',
                borderRadius: themeTokens.radius.sm,
                flexShrink: 0,
              }}
            >
              {language}
            </span>
          </div>

          {onCopy && (
            <Button
              variant={isCopied ? 'primary' : 'ghost'}
              size="sm"
              onClick={onCopy}
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem',
                minHeight: '1.75rem',
                flexShrink: 0,
              }}
            >
              {isCopied ? '✓ Copied!' : 'Copy Code'}
            </Button>
          )}
        </div>
      )}

      {/* Code Body with Line Numbers — one row per line to prevent cross-line highlight corruption */}
      <div
        style={{
          maxHeight,
          overflow: 'auto',
          fontSize: '0.8125rem',
          lineHeight: '1.6',
          maxWidth: '100%',
          width: '100%',
          minWidth: 0,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: themeTokens.typography.fontFamily.mono,
          }}
          aria-label="Source code"
        >
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}>
                {/* Line number cell */}
                <td
                  style={{
                    padding: '0 0.75rem',
                    color: '#4B5563',
                    textAlign: 'right',
                    userSelect: 'none',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    backgroundColor: '#0A0E13',
                    width: '1%',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'top',
                    paddingTop: i === 0 ? '1rem' : undefined,
                    paddingBottom: i === lines.length - 1 ? '1rem' : undefined,
                  }}
                >
                  {i + 1}
                </td>
                {/* Code line cell */}
                <td
                  style={{
                    padding: '0 1rem',
                    color: '#E2E8F0',
                    whiteSpace: 'pre',
                    verticalAlign: 'top',
                    paddingTop: i === 0 ? '1rem' : undefined,
                    paddingBottom: i === lines.length - 1 ? '1rem' : undefined,
                  }}
                  dangerouslySetInnerHTML={{ __html: highlightCode(line) || '&nbsp;' }}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
