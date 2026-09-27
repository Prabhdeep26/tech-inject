import React from 'react';
import { themeTokens } from './tokens.js';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  children,
  ...props
}, ref) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);

  const isDisabled = disabled || isLoading;

  // Variant styling
  let backgroundColor: string = themeTokens.colors.primary;
  let color: string = themeTokens.colors.background;
  let border: string = '1px solid transparent';
  let boxShadow: string = themeTokens.shadows.sm;

  if (variant === 'primary') {
    color = themeTokens.colors.background;
    border = '1px solid transparent';
    if (isActive && !isDisabled) {
      backgroundColor = themeTokens.colors.primaryActive;
      boxShadow = isFocused
        ? `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.primaryActive}`
        : themeTokens.shadows.sm;
    } else if (isHovered && !isDisabled) {
      backgroundColor = themeTokens.colors.primaryHover;
      boxShadow = isFocused
        ? `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.primaryHover}, ${themeTokens.shadows.glow}`
        : themeTokens.shadows.glow;
    } else {
      backgroundColor = themeTokens.colors.primary;
      boxShadow = isFocused
        ? `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.primary}`
        : themeTokens.shadows.sm;
    }
  } else if (variant === 'secondary') {
    color = themeTokens.colors.textPrimary;
    if (isActive && !isDisabled) {
      backgroundColor = themeTokens.colors.surface;
      border = `1px solid ${themeTokens.colors.borderMuted}`;
      boxShadow = isFocused
        ? `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.accentMuted}`
        : themeTokens.shadows.sm;
    } else if (isHovered && !isDisabled) {
      backgroundColor = themeTokens.colors.surfaceElevated;
      border = `1px solid ${themeTokens.colors.borderMuted}`;
      boxShadow = isFocused
        ? `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.accentMuted}, ${themeTokens.shadows.md}`
        : themeTokens.shadows.md;
    } else {
      backgroundColor = themeTokens.colors.surfaceElevated;
      border = `1px solid ${themeTokens.colors.border}`;
      boxShadow = isFocused
        ? `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.accentMuted}`
        : themeTokens.shadows.sm;
    }
  } else if (variant === 'outline') {
    color = themeTokens.colors.primary;
    border = `1px solid ${themeTokens.colors.primary}`;
    if (isActive && !isDisabled) {
      backgroundColor = themeTokens.colors.accentSubtle;
      boxShadow = isFocused
        ? `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.primary}`
        : 'none';
    } else if (isHovered && !isDisabled) {
      backgroundColor = themeTokens.colors.accentSubtle;
      boxShadow = isFocused
        ? `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.primary}, ${themeTokens.shadows.glow}`
        : themeTokens.shadows.glow;
    } else {
      backgroundColor = 'transparent';
      boxShadow = isFocused
        ? `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.primary}`
        : 'none';
    }
  } else if (variant === 'ghost') {
    border = '1px solid transparent';
    if (isActive && !isDisabled) {
      backgroundColor = themeTokens.colors.surface;
      color = themeTokens.colors.textPrimary;
      boxShadow = isFocused
        ? `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.accentMuted}`
        : 'none';
    } else if (isHovered && !isDisabled) {
      backgroundColor = themeTokens.colors.surfaceElevated;
      color = themeTokens.colors.textPrimary;
      boxShadow = isFocused
        ? `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.accentMuted}`
        : 'none';
    } else {
      backgroundColor = 'transparent';
      color = themeTokens.colors.textSecondary;
      boxShadow = isFocused
        ? `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.accentMuted}`
        : 'none';
    }
  } else if (variant === 'danger') {
    color = themeTokens.colors.textPrimary;
    border = '1px solid transparent';
    if (isActive && !isDisabled) {
      backgroundColor = '#B91C1C';
      boxShadow = isFocused
        ? `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.status.danger}`
        : themeTokens.shadows.sm;
    } else if (isHovered && !isDisabled) {
      backgroundColor = '#DC2626';
      boxShadow = isFocused
        ? `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.status.danger}`
        : themeTokens.shadows.md;
    } else {
      backgroundColor = themeTokens.colors.status.danger;
      boxShadow = isFocused
        ? `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.status.danger}`
        : themeTokens.shadows.sm;
    }
  }

  // Size styling using spacing scale tokens
  let padding: string = `${themeTokens.spacing.sm} ${themeTokens.spacing.lg}`; // 8px 16px
  let fontSize: string = themeTokens.typography.fontSize.sm;
  let minHeight: string = '2.5rem';
  let gap: string = themeTokens.spacing.sm;

  if (size === 'sm') {
    padding = `${themeTokens.spacing.xs} ${themeTokens.spacing.md}`; // 4px 12px
    fontSize = themeTokens.typography.fontSize.xs;
    minHeight = themeTokens.spacing['2xl']; // 2rem (32px)
    gap = themeTokens.spacing.xs;
  } else if (size === 'lg') {
    padding = `${themeTokens.spacing.md} ${themeTokens.spacing.xl}`; // 12px 24px
    fontSize = themeTokens.typography.fontSize.base;
    minHeight = themeTokens.spacing['3xl']; // 3rem (48px)
    gap = themeTokens.spacing.sm;
  }

  const baseStyle: React.CSSProperties = {
    display: fullWidth ? 'flex' : 'inline-flex',
    width: fullWidth ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    gap,
    fontFamily: themeTokens.typography.fontFamily.sans,
    fontSize,
    fontWeight: themeTokens.typography.fontWeight.semibold,
    lineHeight: 1,
    borderRadius: themeTokens.radius.md,
    backgroundColor,
    color,
    border,
    boxShadow: isDisabled ? 'none' : boxShadow,
    padding,
    minHeight,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.5 : 1,
    outline: 'none',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: !isDisabled && isHovered && !isActive ? 'translateY(-1px)' : 'none',
    boxSizing: 'border-box',
    textDecoration: 'none',
    userSelect: 'none',
    ...style,
  };

  return (
    <button
      {...props}
      ref={ref}
      disabled={isDisabled}
      style={baseStyle}
      onMouseEnter={(e) => {
        setIsHovered(true);
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        setIsActive(false);
        props.onMouseLeave?.(e);
      }}
      onMouseDown={(e) => {
        if (!isDisabled) setIsActive(true);
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setIsActive(false);
        props.onMouseUp?.(e);
      }}
      onFocus={(e) => {
        setIsFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !isDisabled) {
          setIsActive(true);
        }
        props.onKeyDown?.(e);
      }}
      onKeyUp={(e) => {
        setIsActive(false);
        props.onKeyUp?.(e);
      }}
    >
      {isLoading ? (
        <span
          style={{
            width: '1rem',
            height: '1rem',
            border: `2px solid currentColor`,
            borderRightColor: 'transparent',
            borderRadius: themeTokens.radius.full,
            animation: 'spin 0.75s linear infinite',
            display: 'inline-block',
          }}
        />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
});

Button.displayName = 'Button';
