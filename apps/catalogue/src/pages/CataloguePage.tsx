import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  themeTokens,
  ErrorMessage,
  getFriendlyErrorMessage,
} from '@tech-inject/ui-theme';
import type { Component } from '@tech-inject/types';
import { fallbackComponents } from '../data/mockComponents';
import { apiClient } from '../services/api';

export const CataloguePage: React.FC = () => {
  const navigate = useNavigate();

  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'premium'>('all');

  const fetchComponents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<any>('/components');
      // API response shape: { status: 'success', data: { components: [...], pagination: {...} } }
      const payload = res.data?.data ?? res.data;
      const list: Component[] = Array.isArray(payload?.components) ? payload.components : [];
      if (list.length > 0) {
        setComponents(list);
      } else {
        setComponents(fallbackComponents);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong, please try again');
      // Retain fallback components for offline previewing
      setComponents(fallbackComponents);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  // Derived category list
  const categories = useMemo(() => {
    const list = components.map((c) => c.category).filter(Boolean);
    const unique = Array.from(new Set(list));
    return ['All', ...unique];
  }, [components]);

  // Filtered components based on search and category/access selections
  const filteredComponents = useMemo(() => {
    return components.filter((comp) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        comp.name.toLowerCase().includes(q) ||
        comp.description.toLowerCase().includes(q) ||
        comp.category.toLowerCase().includes(q) ||
        comp.slug.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === 'All' ||
        comp.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesAccess =
        accessFilter === 'all' || comp.accessLevel === accessFilter;

      return matchesSearch && matchesCategory && matchesAccess;
    });
  }, [components, search, selectedCategory, accessFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setAccessFilter('all');
  };

  return (
    <div style={{ padding: '3rem 0 6rem' }}>
      <div className="content-wrapper">
        {/* Page Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
            <span
              style={{
                fontFamily: themeTokens.typography.fontFamily.sans,
                fontSize: themeTokens.typography.fontSize.xs,
                fontWeight: themeTokens.typography.fontWeight.semibold,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: themeTokens.colors.primary,
                backgroundColor: themeTokens.colors.accentSubtle,
                border: `1px solid rgba(0, 181, 98, 0.35)`,
                padding: '0.25rem 0.75rem',
                borderRadius: themeTokens.radius.full,
              }}
            >
              Component Catalogue
            </span>
          </div>

          <h1
            style={{
              fontFamily: themeTokens.typography.fontFamily.sans,
              fontSize: '2.5rem',
              fontWeight: themeTokens.typography.fontWeight.bold,
              letterSpacing: '-0.025em',
              margin: '0 0 0.5rem',
              color: themeTokens.colors.textPrimary,
            }}
          >
            Explore &amp; Integrate Components
          </h1>
          <p
            style={{
              fontFamily: themeTokens.typography.fontFamily.sans,
              fontSize: themeTokens.typography.fontSize.base,
              color: themeTokens.colors.textSecondary,
              maxWidth: '680px',
              margin: 0,
              lineHeight: themeTokens.typography.lineHeight.normal,
            }}
          >
            Searchable repository of accessible, type-safe primitives and composite UI blocks. Verified against @tech-inject/types and @tech-inject/ui-theme.
          </p>
        </div>

        {/* Search & Filter Control Bar */}
        <Card
          variant="glass"
          padding="md"
          style={{
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: themeTokens.spacing.md,
          }}
        >
          {/* Top row: Search input & Access Level Toggles */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: themeTokens.spacing.md,
              flexWrap: 'wrap',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 320px' }}>
              <input
                id="component-search-input"
                type="text"
                className="form-input"
                aria-label="Search components by name, category, or description"
                placeholder="Search by component name, category, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: '2.5rem',
                  height: '2.5rem',
                }}
              />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={themeTokens.colors.textMuted}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Access Filter Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: themeTokens.spacing.xs }}>
              <span
                style={{
                  fontFamily: themeTokens.typography.fontFamily.sans,
                  fontSize: themeTokens.typography.fontSize.xs,
                  fontWeight: themeTokens.typography.fontWeight.semibold,
                  color: themeTokens.colors.textSecondary,
                  marginRight: '0.25rem',
                }}
              >
                Access:
              </span>
              <Button
                variant={accessFilter === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                aria-pressed={accessFilter === 'all'}
                onClick={() => setAccessFilter('all')}
                style={{
                  borderColor: accessFilter === 'all' ? themeTokens.colors.primary : 'transparent',
                }}
              >
                All
              </Button>
              <Button
                variant={accessFilter === 'free' ? 'secondary' : 'ghost'}
                size="sm"
                aria-pressed={accessFilter === 'free'}
                onClick={() => setAccessFilter('free')}
                style={{
                  borderColor: accessFilter === 'free' ? themeTokens.colors.primary : 'transparent',
                }}
              >
                Free
              </Button>
              <Button
                variant={accessFilter === 'premium' ? 'secondary' : 'ghost'}
                size="sm"
                aria-pressed={accessFilter === 'premium'}
                onClick={() => setAccessFilter('premium')}
                style={{
                  borderColor: accessFilter === 'premium' ? themeTokens.colors.tier.premium : 'transparent',
                }}
              >
                Premium
              </Button>
            </div>
          </div>

          {/* Bottom row: Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: themeTokens.spacing.xs,
              flexWrap: 'wrap',
              borderTop: `1px solid ${themeTokens.colors.border}`,
              paddingTop: themeTokens.spacing.sm,
            }}
          >
            <span
              style={{
                fontFamily: themeTokens.typography.fontFamily.sans,
                fontSize: themeTokens.typography.fontSize.xs,
                fontWeight: themeTokens.typography.fontWeight.semibold,
                color: themeTokens.colors.textMuted,
                marginRight: '0.5rem',
              }}
            >
              Categories:
            </span>
            {categories.map((cat) => {
              const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    fontFamily: themeTokens.typography.fontFamily.sans,
                    fontSize: themeTokens.typography.fontSize.xs,
                    fontWeight: isSelected ? 600 : 500,
                    padding: '0.3rem 0.75rem',
                    borderRadius: themeTokens.radius.full,
                    backgroundColor: isSelected
                      ? themeTokens.colors.accentSubtle
                      : themeTokens.colors.backgroundSubtle,
                    color: isSelected ? themeTokens.colors.primary : themeTokens.colors.textSecondary,
                    border: `1px solid ${
                      isSelected ? themeTokens.colors.primary : themeTokens.colors.border
                    }`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </Card>

        {/* ERROR STATE */}
        {error && (
          <ErrorMessage
            error={error}
            message={`${getFriendlyErrorMessage(error)} (Viewing cached/fallback components)`}
            onRetry={fetchComponents}
            retryLabel="Retry API"
            style={{ marginBottom: '2rem' }}
          />
        )}

        <section aria-labelledby="components-directory-heading">
          <h2
            id="components-directory-heading"
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: themeTokens.colors.textPrimary,
              margin: '0 0 1.25rem',
            }}
          >
            Available Components
          </h2>

          {/* LOADING STATE */}
          {loading ? (
            <div className="component-grid">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <Card
                  key={idx}
                  variant="surface"
                  padding="lg"
                  style={{
                    height: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    opacity: 0.6,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: themeTokens.spacing.md,
                      }}
                    >
                      <div
                        style={{
                          height: '1.25rem',
                          width: '35%',
                          backgroundColor: themeTokens.colors.surfaceElevated,
                          borderRadius: themeTokens.radius.sm,
                        }}
                      />
                      <div
                        style={{
                          height: '1.25rem',
                          width: '22%',
                          backgroundColor: themeTokens.colors.surfaceElevated,
                          borderRadius: themeTokens.radius.full,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        height: '1.5rem',
                        width: '70%',
                        backgroundColor: themeTokens.colors.surfaceElevated,
                        borderRadius: themeTokens.radius.sm,
                        marginBottom: themeTokens.spacing.sm,
                      }}
                    />
                    <div
                      style={{
                        height: '0.875rem',
                        width: '95%',
                        backgroundColor: themeTokens.colors.surfaceElevated,
                        borderRadius: themeTokens.radius.sm,
                        marginBottom: themeTokens.spacing.xs,
                      }}
                    />
                    <div
                      style={{
                        height: '0.875rem',
                        width: '60%',
                        backgroundColor: themeTokens.colors.surfaceElevated,
                        borderRadius: themeTokens.radius.sm,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: themeTokens.spacing.md,
                      borderTop: `1px solid ${themeTokens.colors.border}`,
                      marginTop: 'auto',
                    }}
                  >
                    <div
                      style={{
                        height: '1rem',
                        width: '25%',
                        backgroundColor: themeTokens.colors.surfaceElevated,
                        borderRadius: themeTokens.radius.sm,
                      }}
                    />
                    <div
                      style={{
                        height: '2rem',
                        width: '35%',
                        backgroundColor: themeTokens.colors.surfaceElevated,
                        borderRadius: themeTokens.radius.md,
                      }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredComponents.length === 0 ? (
            /* EMPTY STATE */
            <Card
              variant="glass"
              padding="xl"
              style={{
                textAlign: 'center',
                padding: '4.5rem 2rem',
              }}
            >
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '50%',
                  backgroundColor: themeTokens.colors.surfaceElevated,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  color: themeTokens.colors.textMuted,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h2
                style={{
                  fontFamily: themeTokens.typography.fontFamily.sans,
                  fontSize: '1.25rem',
                  fontWeight: themeTokens.typography.fontWeight.semibold,
                  margin: '0 0 0.5rem',
                  color: themeTokens.colors.textPrimary,
                }}
              >
                No Components Found
              </h2>
              <p
                style={{
                  fontFamily: themeTokens.typography.fontFamily.sans,
                  fontSize: themeTokens.typography.fontSize.sm,
                  color: themeTokens.colors.textSecondary,
                  maxWidth: '440px',
                  margin: '0 auto 1.5rem',
                  lineHeight: themeTokens.typography.lineHeight.normal,
                }}
              >
                We couldn’t find any components matching your search &ldquo;{search}&rdquo; or filter criteria.
              </p>
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear Search &amp; Filters
              </Button>
            </Card>
          ) : (
            /* COMPONENT GRID */
            <div className="component-grid">
              {filteredComponents.map((comp) => {
                const isPremium = comp.accessLevel === 'premium';
                return (
                  <Card
                    key={comp.id || comp.slug}
                    variant="surface"
                    padding="lg"
                    interactive
                    data-testid={`card-${comp.slug}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                    }}
                  >
                    <div>
                      {/* Header Badges: Category & Free/Premium */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: themeTokens.spacing.sm,
                          marginBottom: themeTokens.spacing.md,
                        }}
                      >
                        {/* Category Label / Eyebrow */}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontFamily: themeTokens.typography.fontFamily.sans,
                            fontSize: themeTokens.typography.fontSize.xs,
                            fontWeight: themeTokens.typography.fontWeight.semibold,
                            color: themeTokens.colors.textMuted,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            backgroundColor: themeTokens.colors.backgroundSubtle,
                            padding: `0.2rem ${themeTokens.spacing.sm}`,
                            borderRadius: themeTokens.radius.sm,
                            border: `1px solid ${themeTokens.colors.border}`,
                            lineHeight: 1,
                          }}
                        >
                          {comp.category || 'Component'}
                        </span>

                        {/* Entitlement Badge: Free vs Premium */}
                        {isPremium ? (
                          <Badge
                            variant="premium"
                            size="sm"
                            className="badge-premium"
                            leftIcon={<span style={{ fontSize: '0.625rem', lineHeight: 1 }} aria-hidden="true">★</span>}
                          >
                            Premium
                          </Badge>
                        ) : (
                          <Badge
                            variant="free"
                            size="sm"
                            className="badge-free"
                            dot
                          >
                            Free
                          </Badge>
                        )}
                      </div>

                      {/* Component Title */}
                      <CardHeader style={{ marginBottom: themeTokens.spacing.xs, padding: 0 }}>
                        <CardTitle
                          style={{
                            fontFamily: themeTokens.typography.fontFamily.sans,
                            fontSize: themeTokens.typography.fontSize.lg,
                            fontWeight: themeTokens.typography.fontWeight.bold,
                            color: themeTokens.colors.textPrimary,
                            lineHeight: themeTokens.typography.lineHeight.tight,
                            letterSpacing: '-0.015em',
                          }}
                        >
                          {comp.name}
                        </CardTitle>
                      </CardHeader>

                      {/* Component Description */}
                      <CardContent
                        style={{
                          padding: 0,
                          margin: 0,
                          marginBottom: themeTokens.spacing.md,
                          fontFamily: themeTokens.typography.fontFamily.sans,
                          fontSize: themeTokens.typography.fontSize.sm,
                          fontWeight: themeTokens.typography.fontWeight.normal,
                          color: themeTokens.colors.textSecondary,
                          lineHeight: themeTokens.typography.lineHeight.normal,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '3.9rem',
                        }}
                      >
                        {comp.description}
                      </CardContent>

                      {/* Dependencies preview tags if available */}
                      {comp.dependencies && comp.dependencies.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            gap: themeTokens.spacing.xs,
                            flexWrap: 'wrap',
                            marginBottom: themeTokens.spacing.md,
                          }}
                        >
                          {comp.dependencies.slice(0, 3).map((dep) => (
                            <span
                              key={dep}
                              style={{
                                fontFamily: themeTokens.typography.fontFamily.mono,
                                fontSize: '0.6875rem',
                                color: themeTokens.colors.textMuted,
                                backgroundColor: themeTokens.colors.backgroundSubtle,
                                padding: `0.15rem ${themeTokens.spacing.xs}`,
                                borderRadius: themeTokens.radius.sm,
                                border: `1px solid ${themeTokens.colors.border}`,
                              }}
                            >
                              {dep}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer with Version & Direct Action Button */}
                    <CardFooter
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: themeTokens.spacing.md,
                        marginTop: 'auto',
                        borderTop: `1px solid ${themeTokens.colors.border}`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: themeTokens.typography.fontFamily.mono,
                          fontSize: themeTokens.typography.fontSize.xs,
                          color: themeTokens.colors.textMuted,
                        }}
                      >
                        v{comp.version}
                      </span>

                      <Button
                        variant={isPremium ? 'secondary' : 'primary'}
                        size="sm"
                        data-testid={`view-details-${comp.slug}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/components/${comp.slug}`);
                        }}
                        rightIcon={<span aria-hidden="true">&rarr;</span>}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
