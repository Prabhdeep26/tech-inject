import React from 'react';
import { themeTokens } from './tokens.js';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'premium' | 'free' | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
  interactive?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({
  variant = 'default',
  size = 'sm',
  dot = false,
  interactive = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  children,
  tabIndex,
  role,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);

  const isClickable = (interactive || Boolean(props.onClick)) && !disabled;

  let backgroundColor: string = themeTokens.colors.surfaceElevated;
  let color: string = themeTokens.colors.textSecondary;
  let border: string = `1px solid ${themeTokens.colors.borderMuted}`;

  if (variant === 'success') {
    backgroundColor = 'rgba(34, 197, 94, 0.15)';
    color = themeTokens.colors.status.success;
    border = '1px solid rgba(34, 197, 94, 0.3)';
  } else if (variant === 'warning') {
    backgroundColor = 'rgba(245, 158, 11, 0.15)';
    color = themeTokens.colors.status.warning;
    border = '1px solid rgba(245, 158, 11, 0.3)';
  } else if (variant === 'danger') {
    backgroundColor = 'rgba(239, 68, 68, 0.15)';
    color = themeTokens.colors.status.danger;
    border = '1px solid rgba(239, 68, 68, 0.3)';
  } else if (variant === 'info') {
    backgroundColor = 'rgba(59, 130, 246, 0.15)';
    color = themeTokens.colors.status.info;
    border = '1px solid rgba(59, 130, 246, 0.3)';
  } else if (variant === 'premium') {
    backgroundColor = 'transparent'; // handled by background gradient
    color = themeTokens.colors.tier.premium;
    border = '1px solid rgba(168, 85, 247, 0.35)';
  } else if (variant === 'free') {
    backgroundColor = themeTokens.colors.accentSubtle;
    color = themeTokens.colors.tier.free;
    border = '1px solid rgba(0, 181, 98, 0.3)';
  } else if (variant === 'outline') {
    backgroundColor = 'transparent';
    color = themeTokens.colors.textSecondary;
    border = `1px solid ${themeTokens.colors.border}`;
  }

  // Size styling using spacing scale
  let padding: string = `0.125rem ${themeTokens.spacing.sm}`; // 2px 8px
  let fontSize: string = themeTokens.typography.fontSize.xs; // 12px
  let height: string = '1.25rem';
  let gap: string = themeTokens.spacing.xs; // 4px

  if (size === 'md') {
    padding = `${themeTokens.spacing.xs} ${themeTokens.spacing.md}`; // 4px 12px
    fontSize = themeTokens.typography.fontSize.xs;
    height = '1.5rem';
    gap = themeTokens.spacing.xs;
  }

  let boxShadow = 'none';
  let transform = 'none';

  if (isClickable) {
    if (isFocused) {
      boxShadow = `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.accentMuted}`;
    } else if (isHovered && !isActive) {
      transform = 'translateY(-1px)';
    } else if (isActive) {
      transform = 'translateY(0px)';
    }
  }

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap,
    fontFamily: themeTokens.typography.fontFamily.sans,
    fontSize,
    fontWeight: themeTokens.typography.fontWeight.semibold,
    lineHeight: themeTokens.typography.lineHeight.tight,
    borderRadius: themeTokens.radius.full,
    background: variant === 'premium' ? themeTokens.colors.tier.premiumGradient : backgroundColor,
    color,
    border,
    padding,
    height,
    boxShadow,
    transform,
    filter: isClickable && isHovered ? 'brightness(1.15)' : 'none',
    cursor: isClickable ? 'pointer' : 'default',
    opacity: disabled ? 0.5 : 1,
    outline: 'none',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    ...style,
  };

  return (
    <span
      {...props}
      ref={ref}
      role={role ?? (isClickable ? 'button' : undefined)}
      tabIndex={isClickable ? (tabIndex ?? 0) : tabIndex}
      aria-disabled={disabled || undefined}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (isClickable) setIsHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        setIsActive(false);
        onMouseLeave?.(e);
      }}
      onMouseDown={(e) => {
        if (isClickable) setIsActive(true);
        onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setIsActive(false);
        onMouseUp?.(e);
      }}
      onFocus={(e) => {
        if (isClickable) setIsFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        onBlur?.(e);
      }}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: themeTokens.radius.full,
            backgroundColor: 'currentColor',
            flexShrink: 0,
          }}
        />
      )}
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </span>
  );
});

Badge.displayName = 'Badge';
