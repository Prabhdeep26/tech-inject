import React from 'react';
import { themeTokens } from './tokens.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'elevated' | 'glass' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  disabled?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  variant = 'surface',
  padding = 'lg',
  interactive = false,
  disabled = false,
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

  let backgroundColor: string = themeTokens.colors.surface;
  let border: string = `1px solid ${themeTokens.colors.border}`;
  let backdropFilter: string = 'none';

  if (variant === 'elevated') {
    backgroundColor = themeTokens.colors.surfaceElevated;
    border = `1px solid ${themeTokens.colors.borderMuted}`;
  } else if (variant === 'glass') {
    backgroundColor = 'rgba(24, 32, 38, 0.7)';
    border = `1px solid ${themeTokens.colors.borderMuted}`;
    backdropFilter = 'blur(12px)';
  } else if (variant === 'outline') {
    backgroundColor = 'transparent';
    border = `1px solid ${themeTokens.colors.border}`;
  }

  // Consistent padding using spacing scale
  let paddingValue: string = themeTokens.spacing.lg; // default 16px (spacing.lg)
  if (padding === 'none') paddingValue = '0';
  else if (padding === 'sm') paddingValue = themeTokens.spacing.sm; // 8px
  else if (padding === 'md') paddingValue = themeTokens.spacing.md; // 12px
  else if (padding === 'lg') paddingValue = themeTokens.spacing.lg; // 16px
  else if (padding === 'xl') paddingValue = themeTokens.spacing.xl; // 24px

  // Interactive border and shadow states
  let currentBorder = border;
  let currentBoxShadow: string = themeTokens.shadows.md;
  let currentTransform: string = 'none';

  if (interactive && !disabled) {
    if (isFocused) {
      currentBorder = `1px solid ${themeTokens.colors.accentMuted}`;
      currentBoxShadow = `0 0 0 2px ${themeTokens.colors.background}, 0 0 0 4px ${themeTokens.colors.accentMuted}`;
    } else if (isHovered && !isActive) {
      currentBorder = `1px solid ${themeTokens.colors.accentMuted}`;
      currentBoxShadow = themeTokens.shadows.lg;
      currentTransform = 'translateY(-2px)';
    } else if (isActive) {
      currentBorder = `1px solid ${themeTokens.colors.accentMuted}`;
      currentBoxShadow = themeTokens.shadows.md;
      currentTransform = 'translateY(0px)';
    }
  }

  const baseStyle: React.CSSProperties = {
    backgroundColor,
    border: currentBorder,
    borderRadius: themeTokens.radius.lg,
    padding: paddingValue,
    boxShadow: currentBoxShadow,
    backdropFilter,
    outline: 'none',
    cursor: interactive && !disabled ? 'pointer' : 'default',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: currentTransform,
    boxSizing: 'border-box',
    ...style,
  };

  return (
    <div
      {...props}
      ref={ref}
      role={role}
      tabIndex={tabIndex}
      aria-disabled={disabled || undefined}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (interactive && !disabled) setIsHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        setIsActive(false);
        onMouseLeave?.(e);
      }}
      onMouseDown={(e) => {
        if (interactive && !disabled) setIsActive(true);
        onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setIsActive(false);
        onMouseUp?.(e);
      }}
      onFocus={(e) => {
        if (interactive && !disabled) setIsFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        onBlur?.(e);
      }}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  style,
  children,
  ...props
}, ref) => (
  <div
    {...props}
    ref={ref}
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: themeTokens.spacing.xs,
      marginBottom: themeTokens.spacing.md,
      ...style,
    }}
  >
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({
  style,
  children,
  ...props
}, ref) => (
  <h3
    {...props}
    ref={ref}
    style={{
      margin: 0,
      fontFamily: themeTokens.typography.fontFamily.sans,
      fontSize: themeTokens.typography.fontSize.lg,
      fontWeight: themeTokens.typography.fontWeight.semibold,
      color: themeTokens.colors.textPrimary,
      lineHeight: themeTokens.typography.lineHeight.tight,
      ...style,
    }}
  >
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({
  style,
  children,
  ...props
}, ref) => (
  <p
    {...props}
    ref={ref}
    style={{
      margin: 0,
      fontFamily: themeTokens.typography.fontFamily.sans,
      fontSize: themeTokens.typography.fontSize.sm,
      fontWeight: themeTokens.typography.fontWeight.normal,
      color: themeTokens.colors.textSecondary,
      lineHeight: themeTokens.typography.lineHeight.normal,
      ...style,
    }}
  >
    {children}
  </p>
));

CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  style,
  children,
  ...props
}, ref) => (
  <div
    {...props}
    ref={ref}
    style={{
      fontFamily: themeTokens.typography.fontFamily.sans,
      fontSize: themeTokens.typography.fontSize.sm,
      color: themeTokens.colors.textSecondary,
      lineHeight: themeTokens.typography.lineHeight.normal,
      ...style,
    }}
  >
    {children}
  </div>
));

CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  style,
  children,
  ...props
}, ref) => (
  <div
    {...props}
    ref={ref}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: themeTokens.spacing.sm,
      paddingTop: themeTokens.spacing.md,
      marginTop: themeTokens.spacing.md,
      borderTop: `1px solid ${themeTokens.colors.border}`,
      ...style,
    }}
  >
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';
