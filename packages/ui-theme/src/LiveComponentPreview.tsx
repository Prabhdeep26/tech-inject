import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Button,
  Card,
  Badge,
  Input,
  themeTokens,
} from './index.js';
import type { Component } from '@tech-inject/types';

interface LiveComponentPreviewProps {
  component: Component;
}

export const LiveComponentPreview: React.FC<LiveComponentPreviewProps> = ({ component }) => {
  // Preset Variants
  const [selectedPreset, setSelectedPreset] = useState<string>('default');

  // Interactive States
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [isSelected, setIsSelected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [simulateHover, setSimulateHover] = useState<boolean>(false);

  // Common Prop Controls
  const [variant, setVariant] = useState<'primary' | 'secondary' | 'outline' | 'ghost'>('primary');
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');

  // DOM Inspector state
  const [showDomInspector, setShowDomInspector] = useState<boolean>(false);

  // Event Log to prove interactivity
  const [eventLogs, setEventLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Live React DOM sandbox initialized for "${component.name}". Ready for interaction.`,
  ]);

  const logEvent = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setEventLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 5)]);
  };

  // Sync preset changes
  const applyPreset = (preset: string) => {
    setSelectedPreset(preset);
    if (preset === 'default') {
      setVariant('primary');
      setSize('md');
      setIsDisabled(false);
      setIsSelected(false);
      setIsLoading(false);
      logEvent('Applied "Default Primary" preset');
    } else if (preset === 'secondary') {
      setVariant('secondary');
      setSize('md');
      setIsDisabled(false);
      setIsSelected(false);
      setIsLoading(false);
      logEvent('Applied "Secondary Surface" preset');
    } else if (preset === 'selected') {
      setVariant('primary');
      setIsSelected(true);
      setIsDisabled(false);
      setIsLoading(false);
      logEvent('Applied "Selected / Active" preset');
    } else if (preset === 'loading') {
      setIsLoading(true);
      setIsDisabled(false);
      setIsSelected(false);
      logEvent('Applied "Loading Spinner" preset');
    } else if (preset === 'disabled') {
      setIsDisabled(true);
      setIsLoading(false);
      setIsSelected(false);
      logEvent('Applied "Disabled State" preset');
    }
  };

  // ----------------------------------------------------
  // Component 1: Search Input State & Handlers
  // ----------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const mockSearchData = useMemo(
    () => [
      { id: '1', title: 'ActionButton', cat: 'Buttons', tier: 'Free' },
      { id: '2', title: 'StatusBadge', cat: 'Badges', tier: 'Free' },
      { id: '3', title: 'ToastNotification', cat: 'Feedback', tier: 'Free' },
      { id: '4', title: 'Avatar', cat: 'Display', tier: 'Free' },
      { id: '5', title: 'SearchInput', cat: 'Forms', tier: 'Free' },
      { id: '6', title: 'KPIMetricCard', cat: 'Cards', tier: 'Premium' },
      { id: '7', title: 'DataTable', cat: 'Data Display', tier: 'Premium' },
      { id: '8', title: 'CommandPalette', cat: 'Navigation', tier: 'Premium' },
      { id: '9', title: 'FormWizard', cat: 'Forms', tier: 'Premium' },
      { id: '10', title: 'AnalyticsChartCard', cat: 'Cards', tier: 'Premium' },
    ],
    []
  );

  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return mockSearchData.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.cat.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, mockSearchData]);

  // ----------------------------------------------------
  // Component 2: Status Badge State & Handlers
  // ----------------------------------------------------
  const badgeStatuses = useMemo(
    () => [
      { label: 'Operational', variant: 'success', dot: true, desc: 'All systems normal' },
      { label: 'Degraded', variant: 'warning', dot: true, desc: 'High latency detected' },
      { label: 'Outage', variant: 'danger', dot: true, desc: 'Cluster failure' },
      { label: 'Maintenance', variant: 'info', dot: true, desc: 'Scheduled maintenance' },
      { label: 'Premium', variant: 'premium', dot: false, desc: 'Enterprise tier' },
    ],
    []
  );
  const [badgeStatusIndex, setBadgeStatusIndex] = useState(0);

  // ----------------------------------------------------
  // Component 3: Toast Notification State & Handlers
  // ----------------------------------------------------
  const [toastVisible, setToastVisible] = useState(true);
  const [toastType, setToastType] = useState<'success' | 'warning' | 'danger' | 'info'>('success');
  const [toastCounter, setToastCounter] = useState(1);

  // ----------------------------------------------------
  // Component 4: Avatar State & Handlers
  // ----------------------------------------------------
  const [avatarStatus, setAvatarStatus] = useState<'online' | 'busy' | 'away' | 'offline'>('online');

  // ----------------------------------------------------
  // Component 5: Command Palette State & Handlers
  // ----------------------------------------------------
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdSelectedIndex, setCmdSelectedIndex] = useState(0);
  const commandItems = useMemo(
    () => [
      { id: 'c1', group: 'Quick Actions', title: 'Create New Component', shortcut: '⌘N' },
      { id: 'c2', group: 'Quick Actions', title: 'Run Test Suite & Linter', shortcut: '⌘T' },
      { id: 'c3', group: 'Navigation', title: 'Go to Component Catalogue', shortcut: '⌘G' },
      { id: 'c4', group: 'Navigation', title: 'Open Admin Dashboard', shortcut: '⌘D' },
      { id: 'c5', group: 'Preferences', title: 'Toggle Dark / Light Mode', shortcut: '⌘M' },
      { id: 'c6', group: 'Preferences', title: 'Generate AI Integration Prompt', shortcut: '⌘P' },
    ],
    []
  );

  const filteredCommands = useMemo(() => {
    if (!cmdQuery.trim()) return commandItems;
    return commandItems.filter((c) => c.title.toLowerCase().includes(cmdQuery.toLowerCase()));
  }, [cmdQuery, commandItems]);

  // ----------------------------------------------------
  // Component 6: Form Wizard State & Handlers
  // ----------------------------------------------------
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    name: 'My New Pipeline',
    category: 'Forms',
    tier: 'free',
  });

  // ----------------------------------------------------
  // Component 7: Metric Stat Card State
  // ----------------------------------------------------
  const [metricTitle] = useState('Active Daily Agents');
  const [metricValue] = useState('1,428');
  const [metricTrend] = useState('+23.8%');
  const [metricTrendPositive] = useState(true);

  // ----------------------------------------------------
  // Component 8: Data Table State
  // ----------------------------------------------------
  const [selectedRows, setSelectedRows] = useState<string[]>(['usr_2']);
  const [gridSortBy, setGridSortBy] = useState<'name' | 'mrr' | 'status'>('name');
  const [gridSortAsc, setGridSortAsc] = useState(true);

  // ----------------------------------------------------
  // Component 9: Telemetry Chart State
  // ----------------------------------------------------
  const [chartStreaming, setChartStreaming] = useState(true);
  const [chartHoverIndex, setChartHoverIndex] = useState<number | null>(null);
  const [chartData, setChartData] = useState<number[]>([35, 42, 38, 55, 62, 58, 74, 82, 79, 95]);

  useEffect(() => {
    if (!chartStreaming || !component.slug.includes('chart')) return;
    const interval = setInterval(() => {
      setChartData((prev) => {
        const last = prev[prev.length - 1];
        const delta = Math.floor(Math.random() * 15) - 7;
        const next = Math.max(20, Math.min(100, last + delta));
        return [...prev.slice(1), next];
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [chartStreaming, component.slug]);

  // Render Component Specific Previews
  const renderPreviewElement = () => {
    const slug = component.slug.toLowerCase();

    // =========================================================================
    // 1. SEARCH INPUT PREVIEW (Matches: 'search-input', contains 'search' or 'input')
    // =========================================================================
    if (slug === 'search-input' || (slug.includes('search') && !slug.includes('table')) || (slug.includes('input') && !slug.includes('button'))) {
      const inputHeight = size === 'sm' ? '2.125rem' : size === 'lg' ? '3rem' : '2.5rem';
      const inputFontSize = size === 'sm' ? '0.75rem' : size === 'lg' ? '1rem' : '0.875rem';

      return (
        <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Real Live Search Input Bar */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {/* Search Icon or Loading Spinner */}
            <div
              style={{
                position: 'absolute',
                left: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                color: searchFocused || isSelected ? themeTokens.colors.primary : themeTokens.colors.textMuted,
                transition: 'color 0.15s ease',
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    width: size === 'sm' ? '14px' : '18px',
                    height: size === 'sm' ? '14px' : '18px',
                    border: `2px solid ${themeTokens.colors.primary}`,
                    borderRightColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.75s linear infinite',
                  }}
                />
              ) : (
                <svg
                  width={size === 'sm' ? '14' : '18'}
                  height={size === 'sm' ? '14' : '18'}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              )}
            </div>

            {/* Native HTML Input */}
            <input
              type="text"
              id="live-search-input"
              disabled={isDisabled}
              placeholder="Search components, props, hooks..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                logEvent(`Search input value: "${e.target.value}"`);
              }}
              onFocus={() => {
                setSearchFocused(true);
                logEvent('Search input focused');
              }}
              onBlur={() => {
                setSearchFocused(false);
                logEvent('Search input blurred');
              }}
              style={{
                width: '100%',
                height: inputHeight,
                fontSize: inputFontSize,
                fontFamily: themeTokens.typography.fontFamily.sans,
                paddingLeft: '2.5rem',
                paddingRight: searchQuery ? '2.5rem' : '1rem',
                backgroundColor: variant === 'secondary' ? themeTokens.colors.surface : themeTokens.colors.backgroundSubtle,
                color: isDisabled ? themeTokens.colors.textMuted : themeTokens.colors.textPrimary,
                borderRadius: themeTokens.radius.md,
                border: isSelected
                  ? `2px solid ${themeTokens.colors.primary}`
                  : simulateHover && !isDisabled
                  ? `1px solid ${themeTokens.colors.primary}`
                  : searchFocused
                  ? `1px solid ${themeTokens.colors.primary}`
                  : `1px solid ${themeTokens.colors.border}`,
                boxShadow: isSelected || (searchFocused && !isDisabled)
                  ? `0 0 0 3px rgba(0, 181, 98, 0.25)`
                  : simulateHover && !isDisabled
                  ? themeTokens.shadows.glow
                  : 'none',
                outline: 'none',
                cursor: isDisabled ? 'not-allowed' : 'text',
                opacity: isDisabled ? 0.45 : 1,
                transition: 'all 0.15s ease',
              }}
            />

            {/* Clear Button (X) */}
            {searchQuery && !isDisabled && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  logEvent('Cleared search query');
                }}
                title="Clear search"
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '1.25rem',
                  height: '1.25rem',
                  color: themeTokens.colors.textSecondary,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.75rem',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Live Search Results Dropdown Preview */}
          {searchQuery && (
            <div
              style={{
                backgroundColor: themeTokens.colors.surface,
                border: `1px solid ${themeTokens.colors.border}`,
                borderRadius: themeTokens.radius.md,
                padding: '0.5rem',
                boxShadow: themeTokens.shadows.lg,
                maxHeight: '190px',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  color: themeTokens.colors.textMuted,
                  padding: '0.25rem 0.5rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Found {filteredSearchResults.length} Results
              </div>

              {filteredSearchResults.length === 0 ? (
                <div style={{ padding: '0.75rem', fontSize: '0.8125rem', color: themeTokens.colors.textMuted, textAlign: 'center' }}>
                  No matching components found for "{searchQuery}".
                </div>
              ) : (
                filteredSearchResults.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => {
                      setSearchQuery(res.title);
                      logEvent(`Selected result: "${res.title}" (${res.tier})`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.65rem',
                      borderRadius: themeTokens.radius.sm,
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      color: themeTokens.colors.textPrimary,
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 181, 98, 0.12)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span style={{ fontWeight: 500 }}>{res.title}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', color: themeTokens.colors.textMuted }}>{res.cat}</span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          backgroundColor: res.tier === 'Premium' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0, 181, 98, 0.2)',
                          color: res.tier === 'Premium' ? '#C084FC' : themeTokens.colors.primary,
                        }}
                      >
                        {res.tier}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Helper caption */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: themeTokens.colors.textMuted }}>
            <span>Type to test debounced filtering</span>
            <span>{isLoading ? 'Status: Loading...' : isDisabled ? 'Status: Disabled' : 'Status: Ready'}</span>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 2. STATUS BADGE PREVIEW (Matches: 'status-badge', contains 'badge' or 'status')
    // =========================================================================
    if (slug === 'status-badge' || slug.includes('badge') || (slug.includes('status') && !slug.includes('metric'))) {
      const current = badgeStatuses[badgeStatusIndex];
      const badgeScale = size === 'sm' ? 0.85 : size === 'lg' ? 1.25 : 1;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center' }}>
          {/* Active Interactive Badge */}
          <div
            onClick={() => {
              if (isDisabled) return;
              const nextIndex = (badgeStatusIndex + 1) % badgeStatuses.length;
              setBadgeStatusIndex(nextIndex);
              logEvent(`Status Badge clicked: toggled to "${badgeStatuses[nextIndex].label}"`);
            }}
            style={{
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              transform: `scale(${badgeScale})`,
              transition: 'transform 0.15s ease',
              outline: isSelected ? `2px solid ${themeTokens.colors.primary}` : undefined,
              outlineOffset: '4px',
              borderRadius: themeTokens.radius.full,
              opacity: isDisabled ? 0.45 : 1,
            }}
            title={isDisabled ? 'Disabled' : 'Click to cycle status'}
          >
            <Badge
              variant={current.variant as any}
              size={size === 'lg' ? 'md' : (size as any)}
              dot={current.dot}
              interactive={!isDisabled}
              style={{
                boxShadow: simulateHover && !isDisabled ? themeTokens.shadows.glow : undefined,
                border: isSelected ? `1px solid ${themeTokens.colors.primary}` : undefined,
                padding: size === 'lg' ? '0.4rem 1rem' : size === 'sm' ? '0.2rem 0.5rem' : '0.3rem 0.75rem',
                fontSize: size === 'lg' ? '0.9rem' : size === 'sm' ? '0.7rem' : '0.8rem',
              }}
            >
              {isLoading ? 'Syncing...' : current.label}
            </Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: themeTokens.colors.textSecondary }}>
              {current.desc}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={isDisabled}
              onClick={() => {
                const nextIndex = (badgeStatusIndex + 1) % badgeStatuses.length;
                setBadgeStatusIndex(nextIndex);
                logEvent(`Cycled status badge to: ${badgeStatuses[nextIndex].label}`);
              }}
            >
              Cycle Status Variant
            </Button>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 3. TOAST NOTIFICATION PREVIEW (Matches: 'toast-notification', contains 'toast')
    // =========================================================================
    if (slug === 'toast-notification' || slug.includes('toast') || slug.includes('notification')) {
      const toastBg =
        toastType === 'success'
          ? 'rgba(34, 197, 94, 0.12)'
          : toastType === 'warning'
          ? 'rgba(245, 158, 11, 0.12)'
          : toastType === 'danger'
          ? 'rgba(239, 68, 68, 0.12)'
          : 'rgba(59, 130, 246, 0.12)';

      const toastBorder =
        toastType === 'success'
          ? 'rgba(34, 197, 94, 0.35)'
          : toastType === 'warning'
          ? 'rgba(245, 158, 11, 0.35)'
          : toastType === 'danger'
          ? 'rgba(239, 68, 68, 0.35)'
          : 'rgba(59, 130, 246, 0.35)';

      const toastColor =
        toastType === 'success'
          ? themeTokens.colors.status.success
          : toastType === 'warning'
          ? themeTokens.colors.status.warning
          : toastType === 'danger'
          ? themeTokens.colors.status.danger
          : themeTokens.colors.status.info;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%', maxWidth: '440px' }}>
          {/* Live Toast Component Card */}
          {toastVisible ? (
            <div
              style={{
                width: '100%',
                backgroundColor: themeTokens.colors.surface,
                border: `1px solid ${toastBorder}`,
                borderRadius: themeTokens.radius.md,
                padding: size === 'sm' ? '0.75rem' : size === 'lg' ? '1.25rem' : '1rem',
                boxShadow: isSelected ? themeTokens.shadows.glow : simulateHover ? themeTokens.shadows.lg : themeTokens.shadows.md,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                opacity: isDisabled ? 0.45 : 1,
                outline: isSelected ? `2px solid ${themeTokens.colors.primary}` : undefined,
                transition: 'all 0.2s ease',
              }}
            >
              {/* Status Icon */}
              <div
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: toastBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: toastColor,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                {isLoading ? (
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      border: `2px solid ${toastColor}`,
                      borderRightColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.75s linear infinite',
                    }}
                  />
                ) : toastType === 'success' ? (
                  '✓'
                ) : toastType === 'warning' ? (
                  '⚠'
                ) : toastType === 'danger' ? (
                  '✕'
                ) : (
                  'ℹ'
                )}
              </div>

              {/* Toast Text Content */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: themeTokens.colors.textPrimary, fontSize: size === 'lg' ? '1rem' : '0.875rem', marginBottom: '0.2rem' }}>
                  {isLoading
                    ? 'Syncing component bundle...'
                    : toastType === 'success'
                    ? `Build #${toastCounter} deployed successfully`
                    : toastType === 'warning'
                    ? 'API Rate Limit: 85% consumed'
                    : toastType === 'danger'
                    ? 'Connection lost to primary broker'
                    : 'System update available (v2.4.0)'}
                </div>
                <div style={{ fontSize: size === 'sm' ? '0.75rem' : '0.8125rem', color: themeTokens.colors.textSecondary }}>
                  Changes have been distributed across edge CDN locations.
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  setToastVisible(false);
                  logEvent('Dismissed toast notification');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: themeTokens.colors.textMuted,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  padding: '0.2rem',
                  fontSize: '0.875rem',
                  lineHeight: 1,
                }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: themeTokens.colors.surface,
                borderRadius: themeTokens.radius.md,
                border: `1px dashed ${themeTokens.colors.border}`,
                width: '100%',
              }}
            >
              <span style={{ fontSize: '0.8125rem', color: themeTokens.colors.textMuted }}>
                Toast was dismissed. Click below to trigger a new toast.
              </span>
            </div>
          )}

          {/* Trigger Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="primary"
              size="sm"
              disabled={isDisabled}
              onClick={() => {
                setToastVisible(true);
                setToastCounter((c) => c + 1);
                setToastType('success');
                logEvent(`Triggered Success Toast #${toastCounter + 1}`);
              }}
            >
              Trigger Success Toast
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={isDisabled}
              onClick={() => {
                setToastVisible(true);
                setToastCounter((c) => c + 1);
                setToastType('warning');
                logEvent(`Triggered Warning Toast #${toastCounter + 1}`);
              }}
            >
              Trigger Warning
            </Button>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 4. AVATAR PREVIEW (Matches: 'avatar')
    // =========================================================================
    if (slug === 'avatar' || slug.includes('avatar')) {
      const dim = size === 'sm' ? 36 : size === 'lg' ? 64 : 48;
      const statusColor =
        avatarStatus === 'online'
          ? themeTokens.colors.status.success
          : avatarStatus === 'busy'
          ? themeTokens.colors.status.danger
          : avatarStatus === 'away'
          ? themeTokens.colors.status.warning
          : themeTokens.colors.textMuted;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          {/* Avatar Item */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Single Avatar with Status Dot */}
            <div
              onClick={() => {
                if (isDisabled) return;
                const nextStatus: Record<string, 'online' | 'busy' | 'away' | 'offline'> = {
                  online: 'busy',
                  busy: 'away',
                  away: 'offline',
                  offline: 'online',
                };
                const next = nextStatus[avatarStatus];
                setAvatarStatus(next);
                logEvent(`Avatar clicked: toggled status to "${next}"`);
              }}
              style={{
                position: 'relative',
                width: `${dim}px`,
                height: `${dim}px`,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${themeTokens.colors.primary}, #059669)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0B0F12',
                fontWeight: 700,
                fontSize: size === 'sm' ? '0.85rem' : size === 'lg' ? '1.5rem' : '1.15rem',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.45 : 1,
                boxShadow: isSelected ? themeTokens.shadows.glow : simulateHover ? themeTokens.shadows.lg : themeTokens.shadows.sm,
                outline: isSelected ? `3px solid ${themeTokens.colors.primary}` : undefined,
                outlineOffset: '3px',
                transition: 'all 0.15s ease',
              }}
              title={`Status: ${avatarStatus}. Click to toggle.`}
            >
              {isLoading ? (
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #0B0F12',
                    borderRightColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.75s linear infinite',
                  }}
                />
              ) : (
                'AR'
              )}

              {/* Status Dot */}
              <span
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: size === 'sm' ? '8px' : size === 'lg' ? '14px' : '10px',
                  height: size === 'sm' ? '8px' : size === 'lg' ? '14px' : '10px',
                  borderRadius: '50%',
                  backgroundColor: statusColor,
                  border: `2px solid ${themeTokens.colors.background}`,
                  boxShadow: `0 0 6px ${statusColor}`,
                }}
              />
            </div>

            {/* Avatar Group Preview */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {['JD', 'MK', 'TI'].map((initials, idx) => (
                <div
                  key={initials}
                  style={{
                    width: `${dim * 0.85}px`,
                    height: `${dim * 0.85}px`,
                    borderRadius: '50%',
                    backgroundColor: idx === 0 ? '#3B82F6' : idx === 1 ? '#8B5CF6' : themeTokens.colors.surfaceElevated,
                    color: '#fff',
                    border: `2px solid ${themeTokens.colors.background}`,
                    marginLeft: idx === 0 ? 0 : '-0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: size === 'sm' ? '0.7rem' : '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  {initials}
                </div>
              ))}
              <div
                style={{
                  width: `${dim * 0.85}px`,
                  height: `${dim * 0.85}px`,
                  borderRadius: '50%',
                  backgroundColor: themeTokens.colors.surfaceElevated,
                  color: themeTokens.colors.textMuted,
                  border: `2px solid ${themeTokens.colors.background}`,
                  marginLeft: '-0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                +4
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: themeTokens.colors.textSecondary }}>
              Alex Rivera ({avatarStatus.toUpperCase()}) — Click avatar to toggle presence
            </span>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 5. COMMAND PALETTE PREVIEW (Matches: 'command-palette', contains 'command' or 'palette')
    // =========================================================================
    if (slug === 'command-palette' || slug.includes('command') || slug.includes('palette')) {
      return (
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: themeTokens.colors.surface,
            border: `1px solid ${isSelected ? themeTokens.colors.primary : themeTokens.colors.border}`,
            borderRadius: themeTokens.radius.lg,
            overflow: 'hidden',
            boxShadow: isSelected ? themeTokens.shadows.glow : simulateHover ? themeTokens.shadows.lg : themeTokens.shadows.md,
            opacity: isDisabled ? 0.45 : 1,
            pointerEvents: isDisabled ? 'none' : 'auto',
          }}
        >
          {/* Top Search Field */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: `1px solid ${themeTokens.colors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: themeTokens.colors.backgroundSubtle,
            }}
          >
            {isLoading ? (
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: `2px solid ${themeTokens.colors.primary}`,
                  borderRightColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.75s linear infinite',
                }}
              />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={themeTokens.colors.primary} strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
            <input
              type="text"
              placeholder="Type a command or search actions..."
              value={cmdQuery}
              onChange={(e) => {
                setCmdQuery(e.target.value);
                logEvent(`Command query: "${e.target.value}"`);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: themeTokens.colors.textPrimary,
                fontSize: size === 'sm' ? '0.8125rem' : '0.875rem',
                width: '100%',
              }}
            />
            <span
              style={{
                fontSize: '0.7rem',
                fontFamily: themeTokens.typography.fontFamily.mono,
                backgroundColor: themeTokens.colors.surfaceElevated,
                padding: '0.15rem 0.4rem',
                borderRadius: '4px',
                color: themeTokens.colors.textMuted,
                border: `1px solid ${themeTokens.colors.border}`,
              }}
            >
              ESC
            </span>
          </div>

          {/* Command List */}
          <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '0.5rem' }}>
            {filteredCommands.map((cmd, idx) => {
              const isItemActive = idx === cmdSelectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    setCmdSelectedIndex(idx);
                    logEvent(`Command executed: "${cmd.title}"`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: themeTokens.radius.sm,
                    backgroundColor: isItemActive ? 'rgba(0, 181, 98, 0.14)' : 'transparent',
                    color: isItemActive ? themeTokens.colors.primary : themeTokens.colors.textPrimary,
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={() => setCmdSelectedIndex(idx)}
                >
                  <span style={{ fontWeight: isItemActive ? 600 : 400 }}>{cmd.title}</span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: themeTokens.typography.fontFamily.mono,
                      color: isItemActive ? themeTokens.colors.primary : themeTokens.colors.textMuted,
                    }}
                  >
                    {cmd.shortcut}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: '0.5rem 1rem',
              borderTop: `1px solid ${themeTokens.colors.border}`,
              backgroundColor: themeTokens.colors.backgroundSubtle,
              fontSize: '0.7rem',
              color: themeTokens.colors.textMuted,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Use ↑↓ to navigate</span>
            <span>Press Enter to select</span>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 6. FORM WIZARD PREVIEW (Matches: 'form-wizard', contains 'wizard' or 'stepper')
    // =========================================================================
    if (slug === 'form-wizard' || slug.includes('wizard') || slug.includes('stepper')) {
      return (
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: themeTokens.colors.surface,
            border: `1px solid ${isSelected ? themeTokens.colors.primary : themeTokens.colors.border}`,
            borderRadius: themeTokens.radius.lg,
            padding: '1.5rem',
            boxShadow: isSelected ? themeTokens.shadows.glow : simulateHover ? themeTokens.shadows.lg : themeTokens.shadows.sm,
            opacity: isDisabled ? 0.45 : 1,
            pointerEvents: isDisabled ? 'none' : 'auto',
          }}
        >
          {/* Step Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            {[
              { num: 1, label: 'Details' },
              { num: 2, label: 'Config' },
              { num: 3, label: 'Review' },
            ].map((st, i) => {
              const isPast = wizardStep > st.num;
              const isCur = wizardStep === st.num;
              return (
                <div key={st.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <div
                    style={{
                      width: '1.75rem',
                      height: '1.75rem',
                      borderRadius: '50%',
                      backgroundColor: isCur ? themeTokens.colors.primary : isPast ? 'rgba(0, 181, 98, 0.2)' : themeTokens.colors.surfaceElevated,
                      color: isCur ? '#0B0F12' : isPast ? themeTokens.colors.primary : themeTokens.colors.textMuted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {isPast ? '✓' : st.num}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: isCur ? themeTokens.colors.textPrimary : themeTokens.colors.textMuted, fontWeight: isCur ? 600 : 400 }}>
                    {st.label}
                  </span>
                  {i < 2 && (
                    <div style={{ flex: 1, height: '2px', backgroundColor: isPast ? themeTokens.colors.primary : themeTokens.colors.border, margin: '0 0.5rem' }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div style={{ minHeight: '110px', marginBottom: '1.5rem' }}>
            {wizardStep === 1 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: themeTokens.colors.textSecondary, marginBottom: '0.35rem' }}>
                  Project Name
                </label>
                <input
                  type="text"
                  value={wizardData.name}
                  onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {wizardStep === 2 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: themeTokens.colors.textSecondary, marginBottom: '0.5rem' }}>
                  Select Access Tier
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {['free', 'premium'].map((t) => (
                    <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: themeTokens.colors.textPrimary, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="tier"
                        checked={wizardData.tier === t}
                        onChange={() => setWizardData({ ...wizardData, tier: t })}
                      />
                      {t.toUpperCase()} Tier
                    </label>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div style={{ padding: '0.75rem', backgroundColor: themeTokens.colors.backgroundSubtle, borderRadius: themeTokens.radius.md, fontSize: '0.8125rem' }}>
                <div style={{ color: themeTokens.colors.textPrimary, fontWeight: 600, marginBottom: '0.25rem' }}>Summary Confirmation:</div>
                <div style={{ color: themeTokens.colors.textSecondary }}>Project: <strong>{wizardData.name}</strong></div>
                <div style={{ color: themeTokens.colors.textSecondary }}>Tier: <strong>{wizardData.tier.toUpperCase()}</strong></div>
              </div>
            )}
          </div>

          {/* Step Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="secondary"
              size="sm"
              disabled={wizardStep === 1}
              onClick={() => {
                setWizardStep((s) => s - 1);
                logEvent(`Wizard navigated back to Step ${wizardStep - 1}`);
              }}
            >
              Back
            </Button>

            <Button
              variant="primary"
              size="sm"
              isLoading={isLoading}
              onClick={() => {
                if (wizardStep < 3) {
                  setWizardStep((s) => s + 1);
                  logEvent(`Wizard advanced to Step ${wizardStep + 1}`);
                } else {
                  setWizardStep(1);
                  logEvent('Wizard completed and reset!');
                }
              }}
            >
              {wizardStep === 3 ? 'Deploy Setup' : 'Next Step'}
            </Button>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 7. ACTION BUTTON PREVIEW (Matches: 'action-button', contains 'button')
    // =========================================================================
    if (slug === 'action-button' || slug.includes('button')) {
      const activeBorder = isSelected
        ? `2px solid ${themeTokens.colors.primary}`
        : undefined;

      const activeShadow = isSelected
        ? themeTokens.shadows.glow
        : undefined;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Button
            variant={variant}
            size={size}
            disabled={isDisabled}
            isLoading={isLoading}
            style={{
              border: activeBorder,
              boxShadow: activeShadow,
              backgroundColor: simulateHover && !isDisabled
                ? themeTokens.colors.primaryHover
                : undefined,
              outline: isSelected ? `2px solid ${themeTokens.colors.primary}` : undefined,
              outlineOffset: '2px',
            }}
            onClick={() => logEvent(`Button triggered click: variant="${variant}", size="${size}"`)}
            onFocus={() => logEvent('Button received focus')}
            onBlur={() => logEvent('Button lost focus')}
            leftIcon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            }
          >
            {isLoading ? 'Processing Pipeline...' : 'Execute Pipeline'}
          </Button>

          <span style={{ fontSize: '0.75rem', color: themeTokens.colors.textMuted }}>
            Tab or click the button to verify native :focus-visible and active states
          </span>
        </div>
      );
    }

    // =========================================================================
    // 8. METRIC STAT CARD PREVIEW (Matches: 'metric-card', 'metric-stat-card')
    // =========================================================================
    if (slug === 'metric-card' || slug === 'metric-stat-card' || slug.includes('metric') || slug.includes('stat')) {
      if (isLoading) {
        return (
          <div
            style={{
              width: '320px',
              padding: '1.5rem',
              backgroundColor: themeTokens.colors.surface,
              borderRadius: themeTokens.radius.md,
              border: `1px solid ${themeTokens.colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ width: '40%', height: '12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ width: '70%', height: '32px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ width: '50%', height: '14px', backgroundColor: 'rgba(0,181,98,0.2)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
          </div>
        );
      }

      return (
        <Card
          variant={variant === 'secondary' ? 'elevated' : 'glass'}
          padding="lg"
          interactive={!isDisabled}
          style={{
            width: '320px',
            opacity: isDisabled ? 0.45 : 1,
            pointerEvents: isDisabled ? 'none' : 'auto',
            border: isSelected
              ? `2px solid ${themeTokens.colors.primary}`
              : simulateHover
              ? `1px solid ${themeTokens.colors.accentMuted}`
              : undefined,
            boxShadow: isSelected
              ? themeTokens.shadows.glow
              : simulateHover
              ? '0 8px 24px rgba(0,0,0,0.5)'
              : undefined,
            cursor: 'pointer',
          }}
          onClick={() => {
            setIsSelected(!isSelected);
            logEvent(`Metric Card clicked: selected=${!isSelected}`);
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: themeTokens.colors.textSecondary, fontWeight: 500 }}>
              {metricTitle}
            </span>
            {isSelected && (
              <span
                style={{
                  fontSize: '0.65rem',
                  color: themeTokens.colors.primary,
                  backgroundColor: themeTokens.colors.accentSubtle,
                  padding: '0.15rem 0.4rem',
                  borderRadius: themeTokens.radius.sm,
                  fontWeight: 600,
                }}
              >
                SELECTED
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: themeTokens.colors.textPrimary,
              letterSpacing: '-0.02em',
              marginBottom: '0.5rem',
            }}
          >
            {metricValue}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: metricTrendPositive ? themeTokens.colors.status.success : themeTokens.colors.status.danger,
              }}
            >
              <span>{metricTrendPositive ? '▲' : '▼'}</span>
              <span>{metricTrend}</span>
              <span style={{ color: themeTokens.colors.textMuted, fontWeight: 400, fontSize: '0.75rem' }}>
                vs prior cycle
              </span>
            </div>

            {/* Sparkline Visual */}
            <svg width="64" height="24" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 18 L16 14 L30 17 L44 8 L62 4"
                stroke={metricTrendPositive ? themeTokens.colors.status.success : themeTokens.colors.status.danger}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </Card>
      );
    }

    // =========================================================================
    // 9. PRO DATA GRID / DATA TABLE PREVIEW (Matches: 'data-table', 'pro-data-grid')
    // =========================================================================
    if (slug === 'data-table' || slug === 'pro-data-grid' || slug.includes('grid') || slug.includes('table')) {
      const rows = [
        { id: 'usr_1', name: 'Anthropic Agent Pod', mrr: '$4,200', status: 'Active', latency: '42ms' },
        { id: 'usr_2', name: 'DeepMind Alpha Cluster', mrr: '$12,850', status: 'Active', latency: '19ms' },
        { id: 'usr_3', name: 'OpenAI Web Crawler', mrr: '$1,900', status: 'Idle', latency: '110ms' },
      ];

      return (
        <div
          style={{
            width: '100%',
            maxWidth: '640px',
            backgroundColor: themeTokens.colors.surface,
            border: `1px solid ${isSelected ? themeTokens.colors.primary : themeTokens.colors.border}`,
            borderRadius: themeTokens.radius.md,
            overflow: 'hidden',
            opacity: isDisabled ? 0.45 : 1,
            pointerEvents: isDisabled ? 'none' : 'auto',
            position: 'relative',
          }}
        >
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(11, 15, 18, 0.75)',
                backdropFilter: 'blur(4px)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                color: themeTokens.colors.primary,
                fontSize: '0.875rem',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  border: `2px solid ${themeTokens.colors.primary}`,
                  borderRightColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.75s linear infinite',
                }}
              />
              Loading table data...
            </div>
          )}

          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: themeTokens.colors.backgroundSubtle,
              borderBottom: `1px solid ${themeTokens.colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: themeTokens.colors.textPrimary }}>
              Cluster Deployment Grid ({selectedRows.length} selected)
            </span>
            <span style={{ fontSize: '0.75rem', color: themeTokens.colors.textMuted }}>
              Sort: {gridSortBy.toUpperCase()} {gridSortAsc ? '▲' : '▼'}
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${themeTokens.colors.border}`, color: themeTokens.colors.textMuted }}>
                <th style={{ padding: '0.6rem 1rem', width: '36px' }}>
                  <input
                    type="checkbox"
                    checked={selectedRows.length === rows.length}
                    onChange={(e) => {
                      const all = e.target.checked ? rows.map((r) => r.id) : [];
                      setSelectedRows(all);
                      logEvent(`Bulk selection changed: ${all.length} items`);
                    }}
                  />
                </th>
                <th
                  style={{ padding: '0.6rem 1rem', cursor: 'pointer' }}
                  onClick={() => {
                    setGridSortBy('name');
                    setGridSortAsc(!gridSortAsc);
                    logEvent('Sorted by Name');
                  }}
                >
                  Pod Name
                </th>
                <th
                  style={{ padding: '0.6rem 1rem', cursor: 'pointer' }}
                  onClick={() => {
                    setGridSortBy('mrr');
                    setGridSortAsc(!gridSortAsc);
                    logEvent('Sorted by MRR');
                  }}
                >
                  Allocation
                </th>
                <th style={{ padding: '0.6rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isRowSelected = selectedRows.includes(r.id);
                return (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: `1px solid ${themeTokens.colors.border}`,
                      backgroundColor: isRowSelected ? 'rgba(0, 181, 98, 0.08)' : 'transparent',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      const updated = isRowSelected
                        ? selectedRows.filter((id) => id !== r.id)
                        : [...selectedRows, r.id];
                      setSelectedRows(updated);
                      logEvent(`Row toggle ${r.name}: selected=${!isRowSelected}`);
                    }}
                  >
                    <td style={{ padding: '0.6rem 1rem' }}>
                      <input type="checkbox" checked={isRowSelected} onChange={() => {}} />
                    </td>
                    <td style={{ padding: '0.6rem 1rem', color: themeTokens.colors.textPrimary, fontWeight: 500 }}>
                      {r.name}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', color: themeTokens.colors.primary, fontFamily: themeTokens.typography.fontFamily.mono }}>
                      {r.mrr}
                    </td>
                    <td style={{ padding: '0.6rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: themeTokens.radius.full,
                          backgroundColor: r.status === 'Active' ? 'rgba(0, 181, 98, 0.15)' : 'rgba(100, 116, 139, 0.2)',
                          color: r.status === 'Active' ? themeTokens.colors.primary : themeTokens.colors.textMuted,
                          fontWeight: 600,
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // =========================================================================
    // 10. REALTIME TELEMETRY / ANALYTICS CHART PREVIEW (Matches: 'chart')
    // =========================================================================
    if (slug === 'analytics-chart-card' || slug === 'realtime-telemetry-chart' || slug.includes('chart')) {
      const width = 500;
      const height = 160;
      const padding = 20;

      const points = chartData.map((val, idx) => {
        const x = padding + (idx / (chartData.length - 1)) * (width - 2 * padding);
        const y = height - padding - (val / 100) * (height - 2 * padding);
        return { x, y, val, idx };
      });

      const pathString = points.reduce((acc, pt, i) => {
        return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
      }, '');

      const areaString = `${pathString} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

      return (
        <div
          style={{
            width: '100%',
            maxWidth: '560px',
            backgroundColor: themeTokens.colors.surface,
            border: `1px solid ${isSelected ? themeTokens.colors.primary : themeTokens.colors.border}`,
            borderRadius: themeTokens.radius.md,
            padding: '1.25rem',
            opacity: isDisabled ? 0.45 : 1,
            pointerEvents: isDisabled ? 'none' : 'auto',
            position: 'relative',
          }}
        >
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(11, 15, 18, 0.75)',
                backdropFilter: 'blur(4px)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                color: themeTokens.colors.primary,
                fontSize: '0.875rem',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  border: `2px solid ${themeTokens.colors.primary}`,
                  borderRightColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.75s linear infinite',
                }}
              />
              Buffering stream telemetry...
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: themeTokens.colors.textPrimary }}>
                Streaming Telemetry Ingestion (Hz)
              </div>
              <div style={{ fontSize: '0.75rem', color: themeTokens.colors.textMuted }}>
                Live WebSocket socket stream simulation
              </div>
            </div>

            <div
              onClick={() => {
                setChartStreaming(!chartStreaming);
                logEvent(`Chart stream ${!chartStreaming ? 'resumed' : 'paused'}`);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: chartStreaming ? themeTokens.colors.primary : themeTokens.colors.status.danger,
                  boxShadow: chartStreaming ? themeTokens.shadows.glow : 'none',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: themeTokens.colors.textSecondary }}>
                {chartStreaming ? 'Live (Click to Pause)' : 'Paused'}
              </span>
            </div>
          </div>

          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={themeTokens.colors.primary} stopOpacity="0.35" />
                <stop offset="100%" stopColor={themeTokens.colors.primary} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={themeTokens.colors.border} />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke={themeTokens.colors.border} strokeDasharray="3 3" />

            <path d={areaString} fill="url(#chartGradient)" />
            <path d={pathString} fill="none" stroke={themeTokens.colors.primary} strokeWidth="2.5" strokeLinecap="round" />

            {points.map((pt) => {
              const isHoveredPoint = chartHoverIndex === pt.idx;
              return (
                <g key={pt.idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHoveredPoint ? 6 : 4}
                    fill={isHoveredPoint ? themeTokens.colors.primary : '#0B0F12'}
                    stroke={themeTokens.colors.primary}
                    strokeWidth="2"
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    onMouseEnter={() => {
                      setChartHoverIndex(pt.idx);
                      logEvent(`Chart hovered at point #${pt.idx}: ${pt.val}Hz`);
                    }}
                    onMouseLeave={() => setChartHoverIndex(null)}
                  />
                  {isHoveredPoint && (
                    <text
                      x={pt.x}
                      y={pt.y - 12}
                      textAnchor="middle"
                      fill={themeTokens.colors.textPrimary}
                      fontSize="11"
                      fontFamily={themeTokens.typography.fontFamily.mono}
                      fontWeight="bold"
                    >
                      {pt.val}Hz
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      );
    }

    // =========================================================================
    // 11. WIN PROBABILITY METER PREVIEW
    // =========================================================================
    if (slug === 'win-probability-meter' || (slug.includes('probability') && slug.includes('meter'))) {
      const segments = 10;
      const probValue = isSelected ? 86 : 74;
      const activeSegs = Math.round((probValue / 100) * segments);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center' }}>
          <div
            style={{
              padding: '1.25rem 2rem',
              backgroundColor: themeTokens.colors.surface,
              borderRadius: themeTokens.radius.lg,
              border: `1px solid ${isSelected ? themeTokens.colors.primary : themeTokens.colors.border}`,
              boxShadow: isSelected ? themeTokens.shadows.glow : simulateHover ? themeTokens.shadows.lg : themeTokens.shadows.sm,
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              opacity: isDisabled ? 0.45 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {Array.from({ length: segments }).map((_, i) => {
                const isActive = i < activeSegs;
                const ratio = (i + 1) / segments;
                const segColor = !isActive
                  ? '#232D34'
                  : ratio <= 0.35
                  ? '#EF4444'
                  : ratio <= 0.65
                  ? '#F59E0B'
                  : '#10B981';

                return (
                  <span
                    key={i}
                    style={{
                      width: size === 'sm' ? '3px' : size === 'lg' ? '6px' : '4px',
                      height: size === 'sm' ? '14px' : size === 'lg' ? '24px' : '18px',
                      borderRadius: '1px',
                      backgroundColor: segColor,
                      transition: 'background-color 0.2s ease',
                    }}
                  />
                );
              })}
            </div>
            <span
              style={{
                fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.5rem' : '1.125rem',
                fontWeight: 700,
                color: themeTokens.colors.textPrimary,
                fontFamily: themeTokens.typography.fontFamily.mono,
              }}
            >
              {probValue}%
            </span>
          </div>

          <span style={{ fontSize: '0.8125rem', color: themeTokens.colors.textSecondary }}>
            Segmented probability gauge for deal stages and health scoring
          </span>
        </div>
      );
    }

    // =========================================================================
    // 12. ACTIVITY CADENCE SPARKLINE PREVIEW
    // =========================================================================
    if (slug === 'activity-sparkline-bar' || slug.includes('sparkline')) {
      const bars = [4, 7, 3, 10, 6, 14, 9, 12, 8, 15];
      const maxB = Math.max(...bars);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center' }}>
          <div
            style={{
              padding: '1.25rem 2rem',
              backgroundColor: themeTokens.colors.surface,
              borderRadius: themeTokens.radius.lg,
              border: `1px solid ${isSelected ? themeTokens.colors.primary : themeTokens.colors.border}`,
              boxShadow: isSelected ? themeTokens.shadows.glow : simulateHover ? themeTokens.shadows.lg : themeTokens.shadows.sm,
              display: 'flex',
              alignItems: 'flex-end',
              gap: '4px',
              height: size === 'sm' ? '32px' : size === 'lg' ? '56px' : '42px',
              opacity: isDisabled ? 0.45 : 1,
            }}
          >
            {bars.map((val, idx) => {
              const heightPct = Math.max(15, Math.round((val / maxB) * 100));
              return (
                <div
                  key={idx}
                  title={`Activity index ${idx + 1}: ${val} interactions`}
                  style={{
                    width: size === 'sm' ? '4px' : size === 'lg' ? '8px' : '6px',
                    height: `${heightPct}%`,
                    backgroundColor: themeTokens.colors.primary,
                    borderRadius: '2px',
                    opacity: 0.85,
                    cursor: 'pointer',
                    transition: 'opacity 0.15s ease, transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'scaleY(1.1)';
                    logEvent(`Sparkline bar #${idx + 1} hovered: ${val} touchpoints`);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.85';
                    e.currentTarget.style.transform = 'none';
                  }}
                />
              );
            })}
          </div>
          <span style={{ fontSize: '0.8125rem', color: themeTokens.colors.textSecondary }}>
            Interaction velocity & touchpoint volume sparkline
          </span>
        </div>
      );
    }

    // =========================================================================
    // 13. CRM FILTER TOOLBAR PREVIEW
    // =========================================================================
    if (slug === 'crm-filter-toolbar' || (slug.includes('filter') && slug.includes('toolbar'))) {
      return (
        <div
          style={{
            width: '100%',
            maxWidth: '680px',
            padding: '1rem',
            backgroundColor: themeTokens.colors.surface,
            borderRadius: themeTokens.radius.lg,
            border: `1px solid ${isSelected ? themeTokens.colors.primary : themeTokens.colors.border}`,
            boxShadow: isSelected ? themeTokens.shadows.glow : simulateHover ? themeTokens.shadows.lg : themeTokens.shadows.sm,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            opacity: isDisabled ? 0.45 : 1,
            pointerEvents: isDisabled ? 'none' : 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#182026',
                border: '1px solid #263238',
                borderRadius: '9999px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8125rem',
                color: '#A0AEC0',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#7C8DA6' }}>Sort by</span>
              <strong style={{ color: '#F9FBFF' }}>Pipeline Value ▾</strong>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#182026',
                border: '1px solid #263238',
                borderRadius: '9999px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8125rem',
                color: '#A0AEC0',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#7C8DA6' }}>Filter</span>
              <strong style={{ color: '#F9FBFF' }}>All Owners ▾</strong>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#182026',
                border: '1px solid #263238',
                borderRadius: '9999px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8125rem',
                color: '#A0AEC0',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#7C8DA6' }}>Stage</span>
              <strong style={{ color: '#F9FBFF' }}>Any ▾</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => logEvent('Export pipeline clicked')}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => logEvent('+ New Company clicked')}
            >
              + New Company
            </Button>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 14. PROBABILITY RANGE SLIDER PREVIEW
    // =========================================================================
    if (slug === 'probability-range-slider' || (slug.includes('slider') && slug.includes('prob'))) {
      const segs = 24;
      const sliderVal = 65;
      const activeS = Math.round((sliderVal / 100) * segs);

      return (
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            padding: '1.5rem',
            backgroundColor: themeTokens.colors.surface,
            borderRadius: themeTokens.radius.lg,
            border: `1px solid ${isSelected ? themeTokens.colors.primary : themeTokens.colors.border}`,
            boxShadow: isSelected ? themeTokens.shadows.glow : simulateHover ? themeTokens.shadows.lg : themeTokens.shadows.sm,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            opacity: isDisabled ? 0.45 : 1,
            pointerEvents: isDisabled ? 'none' : 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: themeTokens.colors.textSecondary }}>Win probability</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 800, color: themeTokens.colors.primary }}>{sliderVal}%</span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            defaultValue={sliderVal}
            style={{ width: '100%', accentColor: themeTokens.colors.primary, cursor: 'pointer' }}
            onChange={(e) => logEvent(`Probability slider adjusted to: ${e.target.value}%`)}
          />

          <div style={{ display: 'flex', gap: '2px', height: '6px', width: '100%', marginTop: '0.25rem' }}>
            {Array.from({ length: segs }).map((_, i) => {
              const isAct = i < activeS;
              const ratio = (i + 1) / segs;
              const color = !isAct
                ? '#232D34'
                : ratio <= 0.33
                ? '#EF4444'
                : ratio <= 0.66
                ? '#F59E0B'
                : '#00B562';

              return (
                <span
                  key={i}
                  style={{
                    flex: 1,
                    borderRadius: '1px',
                    backgroundColor: color,
                  }}
                />
              );
            })}
          </div>
        </div>
      );
    }

    // =========================================================================
    // 15. CRM DETAIL DRAWER PREVIEW
    // =========================================================================
    if (slug === 'crm-detail-drawer' || (slug.includes('drawer') && slug.includes('crm'))) {
      return (
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: '#12171B',
            borderRadius: themeTokens.radius.lg,
            border: `1px solid ${isSelected ? themeTokens.colors.primary : '#263238'}`,
            boxShadow: isSelected ? themeTokens.shadows.glow : simulateHover ? themeTokens.shadows.lg : themeTokens.shadows.md,
            overflow: 'hidden',
            opacity: isDisabled ? 0.45 : 1,
          }}
        >
          {/* Header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #232323', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#F9FBFF', fontSize: '0.9rem' }}>🏢 Companies Detail</span>
            <span style={{ color: '#7C8DA6', cursor: 'pointer' }}>✕</span>
          </div>

          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Entity Hero */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '8px', backgroundColor: '#182026', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem' }}>
                🍎
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#F9FBFF' }}>Apple</div>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
                  Pilot
                </span>
              </div>
            </div>

            {/* Health Stat */}
            <div style={{ padding: '0.85rem', backgroundColor: '#182026', borderRadius: '8px', border: '1px solid #232323' }}>
              <div style={{ fontSize: '0.7rem', color: '#7C8DA6', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Pipeline Health</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F9FBFF' }}>82%</div>
              <div style={{ fontSize: '0.75rem', color: '#A0AEC0' }}>Win probability across all open deals</div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button variant="secondary" size="sm">Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => logEvent('Saved CRM detail changes')}>Save Update</Button>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 16. CRM ACTIVITY FEED PREVIEW
    // =========================================================================
    if (slug === 'crm-activity-feed' || (slug.includes('feed') && slug.includes('crm'))) {
      return (
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
            backgroundColor: '#12171B',
            border: `1px solid ${isSelected ? themeTokens.colors.primary : '#263238'}`,
            borderRadius: '12px',
            boxShadow: isSelected ? themeTokens.shadows.glow : simulateHover ? themeTokens.shadows.lg : themeTokens.shadows.md,
            overflow: 'hidden',
            opacity: isDisabled ? 0.45 : 1,
          }}
        >
          <div style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #232323' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <strong style={{ color: '#F9FBFF', fontSize: '0.875rem' }}>Notifications</strong>
              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '9999px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', fontWeight: 700 }}>
                3
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#7C8DA6', cursor: 'pointer' }} onClick={() => logEvent('Marked all as read')}>
              Mark all as read
            </span>
          </div>

          <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: '#182026', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                👨‍💼
              </div>
              <div style={{ flex: 1, fontSize: '0.8125rem', color: '#F9FBFF' }}>
                <div><strong>Mark Darnalds</strong> mentioned you on Microsoft</div>
                <div style={{ marginTop: '0.35rem', padding: '0.45rem 0.65rem', backgroundColor: '#182026', borderRadius: '6px', color: '#A0AEC0', fontSize: '0.75rem' }}>
                  Can you join the pilot review on Friday?
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: '#182026', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                👩‍💼
              </div>
              <div style={{ flex: 1, fontSize: '0.8125rem', color: '#F9FBFF' }}>
                <div><strong>Sarah Nguyen</strong> moved LVMH to Renewal</div>
                <div style={{ fontSize: '0.7rem', color: '#7C8DA6', marginTop: '0.2rem' }}>18m ago • LVMH</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 17. SALES PIPELINE TABLE PREVIEW
    // =========================================================================
    if (slug === 'crm-pipeline-table' || (slug.includes('pipeline') && slug.includes('table'))) {
      return (
        <div
          style={{
            width: '100%',
            maxWidth: '680px',
            backgroundColor: '#12171B',
            border: `1px solid ${isSelected ? themeTokens.colors.primary : '#263238'}`,
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: isSelected ? themeTokens.shadows.glow : simulateHover ? themeTokens.shadows.lg : themeTokens.shadows.md,
            opacity: isDisabled ? 0.45 : 1,
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ color: '#7C8DA6', borderBottom: '1px solid #232323' }}>
                <th style={{ padding: '0.65rem 0.85rem' }}>Company</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Stage</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Owner</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Pipeline Value</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Win Probability</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Apple', stage: 'Pilot', owner: 'Alex Santos', val: '$ 530,111', prob: 82 },
                { name: 'Snowflake', stage: 'Enterprise', owner: 'Grace Miller', val: '$ 520,000', prob: 24 },
                { name: 'Microsoft', stage: 'Strategic', owner: 'Mark Darnalds', val: '$ 320,222', prob: 86 },
              ].map((row) => (
                <tr
                  key={row.name}
                  style={{ borderBottom: '1px solid #1E272E', cursor: 'pointer' }}
                  onClick={() => logEvent(`Selected pipeline row: ${row.name}`)}
                >
                  <td style={{ padding: '0.65rem 0.85rem', color: '#F9FBFF', fontWeight: 600 }}>{row.name}</td>
                  <td style={{ padding: '0.65rem 0.85rem' }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '9999px', backgroundColor: '#182026', color: '#F9FBFF', border: '1px solid #263238' }}>
                      {row.stage}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 0.85rem', color: '#A0AEC0' }}>{row.owner}</td>
                  <td style={{ padding: '0.65rem 0.85rem', color: '#F9FBFF', fontFamily: 'monospace' }}>{row.val}</td>
                  <td style={{ padding: '0.65rem 0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: row.prob > 50 ? '#00B562' : '#F59E0B', fontWeight: 700 }}>{row.prob}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#0E1316', display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: '#7C8DA6' }}>
            <span>3 Companies in view</span>
            <span style={{ cursor: 'pointer', color: '#00B562' }}>+ Sum of pipeline ($ 1,370,333)</span>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 18. DYNAMIC FALLBACK SANDBOX (For any new arbitrary component)
    // =========================================================================
    return (
      <Card
        variant={variant === 'secondary' ? 'elevated' : 'surface'}
        padding="xl"
        interactive={!isDisabled}
        style={{
          maxWidth: '480px',
          width: '100%',
          opacity: isDisabled ? 0.45 : 1,
          pointerEvents: isDisabled ? 'none' : 'auto',
          border: isSelected ? `2px solid ${themeTokens.colors.primary}` : undefined,
          boxShadow: isSelected ? themeTokens.shadows.glow : undefined,
          textAlign: 'center',
        }}
        onClick={() => {
          setIsSelected(!isSelected);
          logEvent(`Component container selected=${!isSelected}`);
        }}
      >
        <div style={{ fontSize: '0.75rem', color: themeTokens.colors.textMuted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          {component.category}
        </div>
        <h3 style={{ margin: '0 0 0.5rem', color: themeTokens.colors.textPrimary, fontSize: '1.25rem' }}>
          {component.name}
        </h3>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: themeTokens.colors.textSecondary }}>
          {component.description}
        </p>
        <Button variant={variant} size={size} disabled={isDisabled} isLoading={isLoading}>
          {isLoading ? 'Executing...' : 'Interactive Action'}
        </Button>
      </Card>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Dynamic Keyframes for Live Pulse and Spinners */}
      <style>{`
        @keyframes liveDomPulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 181, 98, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(0, 181, 98, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 181, 98, 0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Top Controller Bar: Variant Switcher & State Toggles */}
      <Card variant="glass" padding="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Row 1: Realistic Preset Variant Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: themeTokens.typography.fontFamily.sans,
                  fontSize: themeTokens.typography.fontSize.xs,
                  fontWeight: 600,
                  color: themeTokens.colors.textSecondary,
                  marginRight: '0.25rem',
                }}
              >
                Variant Switcher:
              </span>
              {[
                { id: 'default', label: 'Default' },
                { id: 'secondary', label: 'Secondary' },
                { id: 'selected', label: 'Selected / Active' },
                { id: 'loading', label: 'Loading State' },
                { id: 'disabled', label: 'Disabled State' },
              ].map((p) => {
                const active = selectedPreset === p.id;
                return (
                  <Button
                    key={p.id}
                    variant={active ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => applyPreset(p.id)}
                    style={{
                      borderColor: active ? themeTokens.colors.primary : 'transparent',
                      color: active ? themeTokens.colors.primary : themeTokens.colors.textSecondary,
                    }}
                  >
                    {p.label}
                  </Button>
                );
              })}
            </div>

            {/* Quick reset */}
            <Button variant="ghost" size="sm" onClick={() => applyPreset('default')}>
              Reset Controls
            </Button>
          </div>

          {/* Row 2: Granular Interactive State Switches */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              flexWrap: 'wrap',
              borderTop: `1px solid ${themeTokens.colors.border}`,
              paddingTop: '0.75rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: themeTokens.colors.textMuted }}>
              Interactive States:
            </span>

            {/* Hover Simulation */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: themeTokens.colors.textSecondary, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={simulateHover}
                onChange={(e) => {
                  setSimulateHover(e.target.checked);
                  logEvent(`Toggled simulateHover=${e.target.checked}`);
                }}
              />
              Simulate Hover
            </label>

            {/* Selected State */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: themeTokens.colors.textSecondary, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  setIsSelected(e.target.checked);
                  logEvent(`Toggled isSelected=${e.target.checked}`);
                }}
              />
              Selected / Focus Ring
            </label>

            {/* Disabled State */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: themeTokens.colors.textSecondary, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isDisabled}
                onChange={(e) => {
                  setIsDisabled(e.target.checked);
                  logEvent(`Toggled isDisabled=${e.target.checked}`);
                }}
              />
              Disabled
            </label>

            {/* Loading State */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: themeTokens.colors.textSecondary, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isLoading}
                onChange={(e) => {
                  setIsLoading(e.target.checked);
                  logEvent(`Toggled isLoading=${e.target.checked}`);
                }}
              />
              Loading Spinner
            </label>

            {/* Size Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' }}>
              <span style={{ fontSize: '0.75rem', color: themeTokens.colors.textMuted }}>Size:</span>
              {(['sm', 'md', 'lg'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSize(s);
                    logEvent(`Changed size=${s}`);
                  }}
                  style={{
                    padding: '0.15rem 0.45rem',
                    borderRadius: themeTokens.radius.sm,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    backgroundColor: size === s ? themeTokens.colors.primary : themeTokens.colors.backgroundSubtle,
                    color: size === s ? '#0B0F12' : themeTokens.colors.textSecondary,
                    border: `1px solid ${size === s ? themeTokens.colors.primary : themeTokens.colors.border}`,
                    cursor: 'pointer',
                  }}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Preview Sandbox Canvas */}
      <div
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(24, 32, 38, 0.9) 0%, rgba(11, 15, 18, 0.98) 100%)`,
          border: `1px solid ${themeTokens.colors.border}`,
          borderRadius: themeTokens.radius.lg,
          padding: '4rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '340px',
          position: 'relative',
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      >
        {renderPreviewElement()}

        {/* Live React DOM Badge (Clickable to inspect Live Virtual DOM Props) */}
        <button
          type="button"
          onClick={() => {
            setShowDomInspector(!showDomInspector);
            logEvent(`Toggled Live React DOM Inspector: ${!showDomInspector ? 'Opened' : 'Closed'}`);
          }}
          title="Click to inspect live React DOM props & Fiber node state"
          style={{
            position: 'absolute',
            bottom: '0.75rem',
            right: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.6875rem',
            fontFamily: themeTokens.typography.fontFamily.mono,
            color: showDomInspector ? themeTokens.colors.primary : themeTokens.colors.textSecondary,
            backgroundColor: 'rgba(11, 15, 18, 0.85)',
            padding: '0.3rem 0.65rem',
            borderRadius: themeTokens.radius.sm,
            border: `1px solid ${showDomInspector ? themeTokens.colors.primary : themeTokens.colors.border}`,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            zIndex: 20,
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: themeTokens.colors.primary,
              animation: 'liveDomPulse 2s infinite',
            }}
          />
          Live React DOM {showDomInspector ? '▲' : '▼'}
        </button>

        {/* DOM Inspector Popup Overlay */}
        {showDomInspector && (
          <div
            style={{
              position: 'absolute',
              bottom: '2.75rem',
              right: '0.75rem',
              width: '320px',
              backgroundColor: themeTokens.colors.surfaceElevated,
              border: `1px solid ${themeTokens.colors.primary}`,
              borderRadius: themeTokens.radius.md,
              padding: '0.75rem',
              boxShadow: themeTokens.shadows.lg,
              fontSize: '0.75rem',
              fontFamily: themeTokens.typography.fontFamily.mono,
              zIndex: 30,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: `1px solid ${themeTokens.colors.border}`, paddingBottom: '0.35rem' }}>
              <strong style={{ color: themeTokens.colors.primary }}>React DOM Node</strong>
              <span style={{ color: themeTokens.colors.status.success }}>● Mounted (React 19)</span>
            </div>
            <div style={{ color: themeTokens.colors.textSecondary, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div>Component: <strong style={{ color: '#fff' }}>&lt;{component.name.replace(/[^a-zA-Z0-9]/g, '')} /&gt;</strong></div>
              <div>Variant: <span style={{ color: themeTokens.colors.primary }}>"{variant}"</span></div>
              <div>Size: <span style={{ color: themeTokens.colors.primary }}>"{size}"</span></div>
              <div>isLoading: <span style={{ color: isLoading ? themeTokens.colors.status.warning : themeTokens.colors.textMuted }}>{String(isLoading)}</span></div>
              <div>isDisabled: <span style={{ color: isDisabled ? themeTokens.colors.status.danger : themeTokens.colors.textMuted }}>{String(isDisabled)}</span></div>
              <div>isSelected: <span style={{ color: isSelected ? themeTokens.colors.status.success : themeTokens.colors.textMuted }}>{String(isSelected)}</span></div>
              <div>SimulateHover: <span style={{ color: themeTokens.colors.textMuted }}>{String(simulateHover)}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Activity & Event Log (Verifying live responsiveness) */}
      <Card variant="surface" padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span
            style={{
              fontFamily: themeTokens.typography.fontFamily.mono,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: themeTokens.colors.textSecondary,
            }}
          >
            Interaction Event Dispatcher:
          </span>
          <button
            onClick={() => setEventLogs(['Log cleared. Ready for next interaction.'])}
            style={{
              background: 'none',
              border: 'none',
              color: themeTokens.colors.textMuted,
              fontSize: '0.7rem',
              cursor: 'pointer',
            }}
          >
            Clear Log
          </button>
        </div>
        <div
          style={{
            fontFamily: themeTokens.typography.fontFamily.mono,
            fontSize: '0.75rem',
            backgroundColor: themeTokens.colors.backgroundSubtle,
            padding: '0.5rem 0.75rem',
            borderRadius: themeTokens.radius.sm,
            color: themeTokens.colors.primary,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          {eventLogs.map((log, i) => (
            <div key={i} style={{ opacity: i === 0 ? 1 : 0.65 - i * 0.12 }}>
              {log}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
