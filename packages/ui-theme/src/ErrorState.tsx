import React from 'react';
import { themeTokens } from './tokens';
import { Card } from './Card';
import { Button } from './Button';

/**
 * Maps raw backend errors, status codes, and exceptions to clean, user-friendly messages.
 * Guarantees that raw server response bodies, stack traces, and HTTP status codes are never leaked.
 */
export function getFriendlyErrorMessage(
  error: unknown,
  status?: number,
  fallback: string = 'Something went wrong, please try again'
): string {
  let httpStatus = status;
  let rawMessage = '';

  if (typeof error === 'number') {
    httpStatus = httpStatus ?? error;
  } else if (typeof error === 'string') {
    rawMessage = error;
  } else if (error && typeof error === 'object') {
    const anyErr = error as any;
    if (typeof anyErr.status === 'number') {
      httpStatus = httpStatus ?? anyErr.status;
    }
    if (typeof anyErr.statusCode === 'number') {
      httpStatus = httpStatus ?? anyErr.statusCode;
    }
    rawMessage = anyErr.message || anyErr.error || '';
  }

  // 1. Detect and sanitize stack traces or raw technical runtime dumps
  const hasStackTrace =
    rawMessage.includes('    at ') ||
    rawMessage.includes('\nat ') ||
    rawMessage.includes('stack trace') ||
    rawMessage.includes('Error generating stack');

  const isRawSystemDump =
    /Mongo|BSON|E11000|CastError|SyntaxError|TypeError|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|AggregateError|InternalServerError/i.test(
      rawMessage
    );

  if (hasStackTrace || isRawSystemDump) {
    return 'Something went wrong, please try again';
  }

  // 2. Extract HTTP status code from message string if not explicitly given
  if (!httpStatus) {
    const statusMatch = rawMessage.match(/\b(400|401|403|404|409|422|500|502|503|504)\b/);
    if (statusMatch) {
      httpStatus = parseInt(statusMatch[1], 10);
    }
  }

  // 3. Network or gateway failures
  if (
    /Failed to fetch|Network error|NetworkError|net::ERR|network connection|gateway timeout|Gateway Timeout|Database disconnected|Database Gateway/i.test(
      rawMessage
    ) &&
    !rawMessage.includes('Changes rolled back')
  ) {
    return 'Something went wrong, please try again';
  }

  // 4. Map by HTTP Status code
  if (httpStatus === 401 || /\b401\b|unauthorized/i.test(rawMessage)) {
    // Preserve specific credential failure messages if friendly and user-facing
    if (/credential|password|authentication failed/i.test(rawMessage) && !/status|code|http/i.test(rawMessage)) {
      return rawMessage;
    }
    return 'You need to sign in';
  }

  if (httpStatus === 403 || /\b403\b|forbidden/i.test(rawMessage)) {
    return 'Access denied';
  }

  if (httpStatus === 404 || /\b404\b|not found/i.test(rawMessage)) {
    return 'Not found';
  }

  if (
    httpStatus === 500 ||
    httpStatus === 502 ||
    httpStatus === 503 ||
    httpStatus === 504 ||
    /\b(500|502|503|504|internal server error)\b/i.test(rawMessage)
  ) {
    // If the message is an explicit status code wrapper like "Server returned status 500" or "HTTP 500", mask it:
    if (/Server returned|status 500|HTTP 500|status:\s*500/i.test(rawMessage)) {
      return 'Something went wrong, please try again';
    }
    // If it's a specific friendly error like rollback message with "(Changes rolled back)"
    if (rawMessage && rawMessage.includes('Changes rolled back')) {
      return rawMessage;
    }
    // If it's a specific descriptive server message (not a stack trace, not raw dump, not generic Internal Server Error):
    if (
      rawMessage &&
      !hasStackTrace &&
      !isRawSystemDump &&
      !/^\s*(500|internal server error)\s*$/i.test(rawMessage.trim()) &&
      rawMessage.length > 5 &&
      !/^(Server returned|Failed with status|HTTP)\s*\d+/i.test(rawMessage)
    ) {
      return rawMessage;
    }
    return 'Something went wrong, please try again';
  }

  // 5. Clean up any residual raw status prefixes from otherwise readable messages
  if (rawMessage) {
    const cleaned = rawMessage
      .replace(/^Error:\s*/i, '')
      .replace(/^(Server returned|Failed with status|HTTP)\s*\d+[:\s-]*/i, '')
      .trim();

    if (/^(Server returned|Failed with status|HTTP)\s*\d+/i.test(cleaned) || !cleaned) {
      return fallback;
    }
    return cleaned;
  }

  return fallback;
}

export interface ErrorMessageProps {
  error?: unknown;
  status?: number;
  message?: string;
  fallback?: string;
  action?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  retryTestId?: string;
  onDismiss?: () => void;
  'data-testid'?: string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Friendly ErrorMessage banner/alert component.
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  status,
  message,
  fallback = 'Something went wrong, please try again',
  action,
  onRetry,
  retryLabel = 'Retry',
  retryTestId,
  onDismiss,
  'data-testid': testId,
  style,
  className,
}) => {
  const displayText = message || getFriendlyErrorMessage(error, status, fallback);

  return (
    <div
      role="alert"
      data-testid={testId}
      className={className}
      style={{
        padding: '0.875rem 1.25rem',
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '6px',
        color: '#F87171',
        fontSize: '0.875rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
        <span aria-hidden="true" style={{ flexShrink: 0 }}>⚠️</span>
        <span>{displayText}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} data-testid={retryTestId}>
            {retryLabel}
          </Button>
        )}
        {action}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            style={{
              background: 'none',
              border: 'none',
              color: '#F87171',
              cursor: 'pointer',
              fontSize: '1.2rem',
              lineHeight: 1,
              padding: '0 0.25rem',
            }}
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
};

export interface ErrorStateProps {
  error?: unknown;
  status?: number;
  title?: string;
  message?: string;
  fallback?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: React.ReactNode;
  'data-testid'?: string;
  style?: React.CSSProperties;
  cardVariant?: 'surface' | 'glass';
}

/**
 * Friendly ErrorState card/view component for full-page or section-level errors.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  status,
  title,
  message,
  fallback = 'Something went wrong, please try again',
  onRetry,
  retryLabel = 'Try Again',
  action,
  'data-testid': testId,
  style,
  cardVariant = 'surface',
}) => {
  const displayText = message || getFriendlyErrorMessage(error, status, fallback);

  const defaultTitle = React.useMemo(() => {
    if (title) return title;
    if (displayText === 'You need to sign in') return 'Sign In Required';
    if (displayText === 'Access denied') return 'Access Denied';
    if (displayText === 'Not found') return 'Not Found';
    return 'Something Went Wrong';
  }, [title, displayText]);

  return (
    <div
      data-testid={testId}
      style={{
        maxWidth: '520px',
        margin: '2rem auto',
        textAlign: 'center',
        ...style,
      }}
    >
      <Card
        variant={cardVariant}
        padding="xl"
        style={{
          border: '1px solid rgba(239, 68, 68, 0.3)',
          backgroundColor: 'rgba(24, 32, 38, 0.95)',
        }}
      >
        <div
          style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 style={{ color: themeTokens.colors.status.danger, margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
          {defaultTitle}
        </h2>
        <p style={{ color: themeTokens.colors.textSecondary, marginBottom: '1.5rem', fontSize: '0.9375rem', lineHeight: 1.5 }}>
          {displayText}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {onRetry && (
            <Button variant="primary" size="md" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          {action}
        </div>
      </Card>
    </div>
  );
};
