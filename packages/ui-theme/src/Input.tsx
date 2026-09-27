import React from 'react';
import { themeTokens } from './tokens.js';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  error?: string | boolean;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  size = 'md',
  label,
  error,
  helperText,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled = false,
  id,
  style,
  onFocus,
  onBlur,
  onMouseEnter,
  onMouseLeave,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const generatedId = React.useId();
  const inputId = id || (label ? generatedId : undefined);

  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  // Sizing via spacing scale
  let padding: string = `${themeTokens.spacing.sm} ${themeTokens.spacing.md}`; // 8px 12px
  let fontSize: string = themeTokens.typography.fontSize.sm; // 14px
  let minHeight: string = '2.5rem'; // 40px

  if (size === 'sm') {
    padding = `${themeTokens.spacing.xs} ${themeTokens.spacing.sm}`; // 4px 8px
    fontSize = themeTokens.typography.fontSize.xs; // 12px
    minHeight = themeTokens.spacing['2xl']; // 2rem (32px)
  } else if (size === 'lg') {
    padding = `${themeTokens.spacing.md} ${themeTokens.spacing.lg}`; // 12px 16px
    fontSize = themeTokens.typography.fontSize.base; // 16px
    minHeight = themeTokens.spacing['3xl']; // 3rem (48px)
  }

  // Adjust padding if icons are present
  const paddingLeft = leftIcon ? '2.5rem' : undefined;
  const paddingRight = rightIcon ? '2.5rem' : undefined;

  // Dynamic border and shadow state
  let borderColor: string = themeTokens.colors.border;
  let backgroundColor: string = themeTokens.colors.backgroundSubtle;
  let boxShadow: string = themeTokens.shadows.sm;

  if (disabled) {
    backgroundColor = themeTokens.colors.surface;
    borderColor = themeTokens.colors.border;
    boxShadow = 'none';
  } else if (hasError) {
    borderColor = themeTokens.colors.status.danger;
    if (isFocused) {
      boxShadow = `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px rgba(239, 68, 68, 0.35)`;
    }
  } else if (isFocused) {
    borderColor = themeTokens.colors.primary;
    boxShadow = `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px rgba(0, 181, 98, 0.35)`;
  } else if (isHovered) {
    borderColor = themeTokens.colors.borderMuted;
  }

  const containerStyle: React.CSSProperties = {
    display: fullWidth ? 'flex' : 'inline-flex',
    flexDirection: 'column',
    gap: themeTokens.spacing.xs,
    width: fullWidth ? '100%' : 'auto',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    minHeight,
    padding,
    paddingLeft: paddingLeft ?? undefined,
    paddingRight: paddingRight ?? undefined,
    fontFamily: themeTokens.typography.fontFamily.sans,
    fontSize,
    fontWeight: themeTokens.typography.fontWeight.normal,
    lineHeight: themeTokens.typography.lineHeight.normal,
    color: disabled ? themeTokens.colors.textMuted : themeTokens.colors.textPrimary,
    backgroundColor,
    border: `1px solid ${borderColor}`,
    borderRadius: themeTokens.radius.md,
    boxShadow,
    outline: 'none',
    boxSizing: 'border-box',
    cursor: disabled ? 'not-allowed' : 'text',
    opacity: disabled ? 0.6 : 1,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
    ...style,
  };

  return (
    <div style={containerStyle}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            fontFamily: themeTokens.typography.fontFamily.sans,
            fontSize: themeTokens.typography.fontSize.xs,
            fontWeight: themeTokens.typography.fontWeight.semibold,
            color: hasError ? themeTokens.colors.status.danger : themeTokens.colors.textSecondary,
            lineHeight: themeTokens.typography.lineHeight.tight,
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
        {leftIcon && (
          <div
            style={{
              position: 'absolute',
              left: themeTokens.spacing.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              color: isFocused ? themeTokens.colors.primary : themeTokens.colors.textMuted,
            }}
          >
            {leftIcon}
          </div>
        )}

        <input
          {...props}
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={hasError ? true : undefined}
          aria-describedby={
            errorMessage && inputId ? `${inputId}-error` : helperText && inputId ? `${inputId}-helper` : undefined
          }
          style={inputStyle}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          onMouseEnter={(e) => {
            setIsHovered(true);
            onMouseEnter?.(e);
          }}
          onMouseLeave={(e) => {
            setIsHovered(false);
            onMouseLeave?.(e);
          }}
        />

        {rightIcon && (
          <div
            style={{
              position: 'absolute',
              right: themeTokens.spacing.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              color: isFocused ? themeTokens.colors.primary : themeTokens.colors.textMuted,
            }}
          >
            {rightIcon}
          </div>
        )}
      </div>

      {errorMessage && (
        <span
          id={inputId ? `${inputId}-error` : undefined}
          role="alert"
          style={{
            display: 'block',
            fontFamily: themeTokens.typography.fontFamily.sans,
            fontSize: themeTokens.typography.fontSize.xs,
            fontWeight: themeTokens.typography.fontWeight.normal,
            color: themeTokens.colors.status.danger,
            lineHeight: themeTokens.typography.lineHeight.tight,
          }}
        >
          {errorMessage}
        </span>
      )}

      {!errorMessage && helperText && (
        <span
          style={{
            display: 'block',
            fontFamily: themeTokens.typography.fontFamily.sans,
            fontSize: themeTokens.typography.fontSize.xs,
            fontWeight: themeTokens.typography.fontWeight.normal,
            color: themeTokens.colors.textMuted,
            lineHeight: themeTokens.typography.lineHeight.tight,
          }}
        >
          {helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
