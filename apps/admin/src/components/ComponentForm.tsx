import React, { useState, useEffect, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button, themeTokens, LiveComponentPreview, ErrorMessage, getFriendlyErrorMessage } from '@tech-inject/ui-theme';
import { apiClient } from '../services/api';
import type {
  Component,
  ComponentAccessLevel,
  ComponentStatus,
  ComponentPropDefinition,
  ComponentBundle,
} from '@tech-inject/types';

export interface StructuredPropItem {
  id: string;
  name: string;
  type: string;
  defaultValue: string;
  required: boolean;
  description: string;
}

interface ComponentFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<Component>;
  componentId?: string;
  onSuccess: (component: Component) => void;
}

const COMMON_CATEGORIES = [
  'Buttons',
  'Inputs',
  'Navigation',
  'Data Tables',
  'Feedback',
  'Layout',
  'Cards',
  'Modals',
  'Typography',
];

const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ComponentForm: React.FC<ComponentFormProps> = ({
  mode,
  initialValues,
  componentId,
  onSuccess,
}) => {
  const navigate = useNavigate();

  // Basic Details
  const [name, setName] = useState(initialValues?.name || '');
  const [slug, setSlug] = useState(initialValues?.slug || '');
  const [isSlugUserModified, setIsSlugUserModified] = useState(mode === 'edit');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [category, setCategory] = useState(initialValues?.category || 'Buttons');
  const [customCategory, setCustomCategory] = useState('');
  const [version, setVersion] = useState(initialValues?.version || '1.0.0');
  const [accessLevel, setAccessLevel] = useState<ComponentAccessLevel>(
    initialValues?.accessLevel || 'free'
  );
  const [status, setStatus] = useState<ComponentStatus>(initialValues?.status || 'draft');

  // Dependencies
  const [dependencies, setDependencies] = useState<string[]>(
    initialValues?.dependencies && initialValues.dependencies.length > 0
      ? initialValues.dependencies
      : ['react', '@tech-inject/ui-theme']
  );
  const [newDepInput, setNewDepInput] = useState('');

  // Structured Props
  const [propsList, setPropsList] = useState<StructuredPropItem[]>(() => {
    if (initialValues?.props && Object.keys(initialValues.props).length > 0) {
      return Object.entries(initialValues.props).map(([key, p]: [string, any]) => ({
        id: `prop-${Math.random().toString(36).substring(2, 9)}`,
        name: p.name || key,
        type: p.type || 'string',
        defaultValue: p.defaultValue !== undefined ? String(p.defaultValue) : '',
        required: Boolean(p.required),
        description: p.description || '',
      }));
    }
    return [
      {
        id: 'prop-1',
        name: 'variant',
        type: "'primary' | 'secondary' | 'outline'",
        defaultValue: "'primary'",
        required: false,
        description: 'Visual button hierarchy variant',
      },
      {
        id: 'prop-2',
        name: 'size',
        type: "'sm' | 'md' | 'lg'",
        defaultValue: "'md'",
        required: false,
        description: 'Component dimensions and padding scale',
      },
    ];
  });

  // Bundle Upload State
  const [bundleData, setBundleData] = useState<ComponentBundle | null>(null);
  const [bundleFileName, setBundleFileName] = useState<string | null>(null);
  const [bundleSummary, setBundleSummary] = useState<{ fileCount: number; totalSize: number } | null>(null);
  const [bundleError, setBundleError] = useState<string | null>(null);

  // Validation & Submitting States
  const [allExistingComponents, setAllExistingComponents] = useState<Component[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Preview Before Publish States
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewSuccessMessage, setPreviewSuccessMessage] = useState<string | null>(null);
  const [previewComponent, setPreviewComponent] = useState<Component | null>(null);

  // Fetch all existing components to validate slug uniqueness
  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const res = await apiClient.get<any>('/admin/components');
        setAllExistingComponents(res.data?.data?.components || res.data?.components || []);
      } catch {
        // Non-blocking; server will also validate uniqueness
      }
    };
    fetchExisting();
  }, []);

  // Auto-suggest slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugUserModified && mode === 'create') {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
      const err = validateSlug(generated);
      setFieldErrors((prev) => ({ ...prev, slug: err || '' }));
    }
  };

  const handleSlugChange = (val: string) => {
    setIsSlugUserModified(true);
    setSlug(val);
    const err = validateSlug(val);
    setFieldErrors((prev) => ({ ...prev, slug: err || '' }));
  };

  const validateSlug = (val: string): string | null => {
    if (!val) {
      return 'Slug is required';
    }
    if (!SLUG_REGEX.test(val)) {
      return "Slug must be lowercase alphanumeric with hyphens (e.g. 'action-button')";
    }
    if (val.length > 100) {
      return 'Slug cannot exceed 100 characters';
    }
    // Check uniqueness against existing components
    const conflict = allExistingComponents.find(
      (c) => c.slug.toLowerCase() === val.toLowerCase() && c.id !== componentId && c.slug !== initialValues?.slug
    );
    if (conflict) {
      return `Slug '${val}' is already in use by '${conflict.name}'. Slugs must be globally unique.`;
    }
    return null;
  };

  // Structured Props Handlers
  const handleAddProp = () => {
    setPropsList((prev) => [
      ...prev,
      {
        id: `prop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: '',
        type: 'string',
        defaultValue: '',
        required: false,
        description: '',
      },
    ]);
  };

  const handleUpdateProp = (index: number, field: keyof StructuredPropItem, value: any) => {
    setPropsList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveProp = (index: number) => {
    setPropsList((prev) => prev.filter((_, i) => i !== index));
  };

  // Dependency Management Handlers
  const handleAddDependency = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = newDepInput.trim();
    if (trimmed && !dependencies.includes(trimmed)) {
      setDependencies((prev) => [...prev, trimmed]);
      setNewDepInput('');
    }
  };

  const handleRemoveDependency = (depToRemove: string) => {
    setDependencies((prev) => prev.filter((d) => d !== depToRemove));
  };

  // Bundle File Upload Handler
  const handleBundleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBundleError(null);
    setBundleFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Bundle must be a valid JSON object.');
        }

        if (!Array.isArray(parsed.files) || parsed.files.length === 0) {
          throw new Error("Bundle must contain a non-empty 'files' array.");
        }

        for (const f of parsed.files) {
          if (!f.path || typeof f.path !== 'string') {
            throw new Error("Each item in 'files' must have a valid 'path' property.");
          }
          if (typeof f.content !== 'string') {
            throw new Error(`File '${f.path}' content must be a text string.`);
          }
        }

        let totalBytes = 0;
        for (const f of parsed.files) {
          totalBytes += new Blob([f.content]).size;
        }

        setBundleData(parsed);
        setBundleSummary({
          fileCount: parsed.files.length,
          totalSize: totalBytes,
        });

        // If bundle has meta, offer or auto-fill values if empty
        if (parsed.meta) {
          if (!name && parsed.meta.name) setName(parsed.meta.name);
          if (!slug && parsed.meta.slug) setSlug(parsed.meta.slug);
          if (!description && parsed.meta.description) setDescription(parsed.meta.description);
          if (parsed.meta.category) setCategory(parsed.meta.category);
          if (parsed.meta.version) setVersion(parsed.meta.version);
          if (parsed.meta.accessLevel) setAccessLevel(parsed.meta.accessLevel);
          if (parsed.meta.status) setStatus(parsed.meta.status);
          if (Array.isArray(parsed.meta.dependencies) && parsed.meta.dependencies.length > 0) {
            setDependencies(parsed.meta.dependencies);
          }
        }
      } catch (err: any) {
        setBundleError(err.message || 'Invalid JSON bundle file.');
        setBundleData(null);
        setBundleSummary(null);
      }
    };

    reader.onerror = () => {
      setBundleError('Failed to read file.');
    };

    reader.readAsText(file);
  };

  const handleApplyBundleMeta = () => {
    if (!bundleData?.meta) return;
    const meta = bundleData.meta as any;
    if (meta.name) setName(meta.name);
    if (meta.slug) setSlug(meta.slug);
    if (meta.description) setDescription(meta.description);
    if (meta.category) setCategory(meta.category);
    if (meta.version) setVersion(meta.version);
    if (meta.accessLevel) setAccessLevel(meta.accessLevel);
    if (meta.status) setStatus(meta.status);
    if (Array.isArray(meta.dependencies) && meta.dependencies.length > 0) {
      setDependencies(meta.dependencies);
    }
  };

  // Preview & Validate Before Publish Handler
  const handlePreviewValidate = async () => {
    setPreviewError(null);
    setPreviewSuccessMessage(null);

    // Client-side quick verification
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Name is required (max 120 characters)';
    else if (name.length > 120) errors.name = 'Name cannot exceed 120 characters';

    const slugErr = validateSlug(slug);
    if (slugErr) errors.slug = slugErr;

    if (!description.trim()) errors.description = 'Description is required (max 2000 characters)';
    else if (description.length > 2000) errors.description = 'Description cannot exceed 2000 characters';

    const resolvedCategory = category === 'Other' ? customCategory.trim() : category;
    if (!resolvedCategory) errors.category = 'Category is required';

    if (!version.trim()) errors.version = 'Version is required';
    else if (!SEMVER_REGEX.test(version)) {
      errors.version = "Version must follow semantic versioning format (e.g. '1.0.0')";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setPreviewError('Please resolve all highlighted form validation errors before generating preview.');
      return;
    }

    // Build structured props map
    const structuredPropsMap: Record<string, ComponentPropDefinition> = {};
    for (const p of propsList) {
      const propName = p.name.trim();
      if (propName) {
        structuredPropsMap[propName] = {
          name: propName,
          type: p.type.trim() || 'string',
          defaultValue: p.defaultValue.trim() || undefined,
          required: p.required,
          description: p.description.trim() || undefined,
        };
      }
    }

    setPreviewLoading(true);

    try {
      let endpoint = '/admin/components/validate';
      let payload: any;

      if (bundleData) {
        endpoint = '/admin/bundles/validate';
        payload = {
          files: bundleData.files,
          meta: {
            ...(bundleData.meta || {}),
            slug,
            name: name.trim(),
            description: description.trim(),
            category: resolvedCategory,
            version: version.trim(),
            accessLevel,
            status,
            dependencies,
            props: structuredPropsMap,
          },
        };
      } else {
        payload = {
          name: name.trim(),
          slug,
          description: description.trim(),
          category: resolvedCategory,
          version: version.trim(),
          accessLevel,
          status,
          dependencies,
          props: structuredPropsMap,
        };
      }

      const res = await apiClient.post<any>(endpoint, payload);
      const data = res.data;

      const compData = data.data?.component;
      const validatedComp: Component = {
        id: componentId || compData?.id || `preview-${Date.now()}`,
        slug: compData?.slug || slug,
        name: compData?.name || name.trim(),
        description: compData?.description || description.trim(),
        category: compData?.category || resolvedCategory,
        version: compData?.version || version.trim(),
        accessLevel: compData?.accessLevel || accessLevel,
        status: compData?.status || status,
        dependencies: compData?.dependencies || dependencies,
        props: compData?.props || structuredPropsMap,
        createdAt: compData?.createdAt || new Date().toISOString(),
        updatedAt: compData?.updatedAt || new Date().toISOString(),
      };

      setPreviewComponent(validatedComp);
      setShowPreview(true);
      setPreviewSuccessMessage(
        data.message || 'Server validation passed: Component specification verified. Ready for visual review.'
      );
    } catch (err: any) {
      setPreviewError(getFriendlyErrorMessage(err, undefined, 'Failed to validate preview with server.'));
    } finally {
      setPreviewLoading(false);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Client-side Validation (mirroring server Zod schema)
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Name is required (max 120 characters)';
    else if (name.length > 120) errors.name = 'Name cannot exceed 120 characters';

    const slugErr = validateSlug(slug);
    if (slugErr) errors.slug = slugErr;

    if (!description.trim()) errors.description = 'Description is required (max 2000 characters)';
    else if (description.length > 2000) errors.description = 'Description cannot exceed 2000 characters';

    const resolvedCategory = category === 'Other' ? customCategory.trim() : category;
    if (!resolvedCategory) errors.category = 'Category is required';

    if (!version.trim()) errors.version = 'Version is required';
    else if (!SEMVER_REGEX.test(version)) {
      errors.version = "Version must follow semantic versioning format (e.g. '1.0.0')";
    }

    // Validate structured props
    const structuredPropsMap: Record<string, ComponentPropDefinition> = {};
    for (const p of propsList) {
      const propName = p.name.trim();
      if (propName) {
        structuredPropsMap[propName] = {
          name: propName,
          type: p.type.trim() || 'string',
          defaultValue: p.defaultValue.trim() || undefined,
          required: p.required,
          description: p.description.trim() || undefined,
        };
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      // If a full bundle was provided, we upload via POST /admin/bundles
      if (bundleData) {
        const bundlePayload = {
          files: bundleData.files,
          meta: {
            ...(bundleData.meta || {}),
            slug,
            name: name.trim(),
            description: description.trim(),
            category: resolvedCategory,
            version: version.trim(),
            accessLevel,
            status,
            dependencies,
            props: structuredPropsMap,
          },
        };

        const res = await apiClient.post<any>('/admin/bundles', bundlePayload);
        const data = res.data;

        onSuccess(data?.data?.component || data?.component);
        return;
      }

      // Standard Component Metadata Update or Creation without bundle
      const componentPayload = {
        name: name.trim(),
        slug,
        description: description.trim(),
        category: resolvedCategory,
        version: version.trim(),
        accessLevel,
        status,
        dependencies,
        props: structuredPropsMap,
      };

      const url = mode === 'create' ? '/admin/components' : `/admin/components/${componentId || slug}`;
      const res = await (mode === 'create'
        ? apiClient.post<any>(url, componentPayload)
        : apiClient.patch<any>(url, componentPayload));

      const data = res.data;

      onSuccess(data?.data?.component || data?.component);
    } catch (err: any) {
      setServerError(getFriendlyErrorMessage(err, undefined, 'An unexpected error occurred while saving component.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-form-container">
      {/* Top Header Card */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          backgroundColor: themeTokens.colors.surface,
          border: `1px solid ${themeTokens.colors.border}`,
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem', color: themeTokens.colors.textPrimary }}>
            {mode === 'create' ? 'Create New Component' : `Edit Component: ${name || slug}`}
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: themeTokens.colors.textSecondary }}>
            Configure catalogue specifications, structured documentation, and bundle artifacts.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`badge ${accessLevel === 'premium' ? 'badge-warning' : 'badge-info'}`}>
            {accessLevel === 'premium' ? '★ Premium' : 'Free Tier'}
          </span>
          <span className={`badge ${status === 'published' ? 'badge-success' : 'badge-secondary'}`}>
            {status === 'published' ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <ErrorMessage
          data-testid="server-error-banner"
          error={serverError}
          message={serverError}
          onDismiss={() => setServerError(null)}
          style={{ marginBottom: '0.5rem' }}
        />
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* SECTION 1: CORE IDENTIFIERS */}
        <section className="admin-form-section" aria-labelledby="section-1-heading">
          <div className="admin-section-header">
            <div className="admin-section-header-left">
              <div className="admin-section-badge">1</div>
              <div>
                <h2 id="section-1-heading" className="admin-section-title">
                  Core Component Information
                </h2>
                <p className="admin-section-subtitle">
                  Identity, categorization, semantic version, and entitlement access tier.
                </p>
              </div>
            </div>
          </div>

          <div className="admin-form-grid-2">
            <div>
              <label htmlFor="field-name" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: themeTokens.colors.textSecondary, marginBottom: '0.375rem' }}>
                Display Name *
              </label>
              <input
                id="field-name"
                data-testid="input-name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Interactive Action Button"
                style={{ width: '100%', borderColor: fieldErrors.name ? '#EF4444' : undefined }}
              />
              {fieldErrors.name && (
                <div style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {fieldErrors.name}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="field-slug" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: themeTokens.colors.textSecondary, marginBottom: '0.375rem' }}>
                Unique Slug (Auto-suggested) *
              </label>
              <input
                id="field-slug"
                data-testid="input-slug"
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="e.g. action-button"
                style={{ width: '100%', borderColor: fieldErrors.slug ? '#EF4444' : undefined }}
              />
              {fieldErrors.slug ? (
                <div data-testid="slug-error" style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {fieldErrors.slug}
                </div>
              ) : (
                <div style={{ color: themeTokens.colors.textMuted, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  URL &amp; bundle package identifier: <code style={{ color: themeTokens.colors.primary }}>@tech-inject/{slug || 'slug'}</code>
                </div>
              )}
            </div>
          </div>

          <div className="admin-form-grid-2">
            <div>
              <label htmlFor="field-category" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: themeTokens.colors.textSecondary, marginBottom: '0.375rem' }}>
                Category *
              </label>
              <select
                id="field-category"
                data-testid="select-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%' }}
              >
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Other">Other (Custom category...)</option>
              </select>
              {category === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter custom category name..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                />
              )}
            </div>

            <div>
              <label htmlFor="field-version" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: themeTokens.colors.textSecondary, marginBottom: '0.375rem' }}>
                Semantic Version *
              </label>
              <input
                id="field-version"
                data-testid="input-version"
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                style={{ width: '100%', borderColor: fieldErrors.version ? '#EF4444' : undefined }}
              />
              {fieldErrors.version && (
                <div style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {fieldErrors.version}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="field-description" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: themeTokens.colors.textSecondary, marginBottom: '0.375rem' }}>
              Component Description *
            </label>
            <textarea
              id="field-description"
              data-testid="textarea-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain component capability, animations, keyboard operability, and design system integration..."
              style={{ width: '100%', resize: 'vertical', borderColor: fieldErrors.description ? '#EF4444' : undefined }}
            />
            {fieldErrors.description && (
              <div style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {fieldErrors.description}
              </div>
            )}
          </div>

          <div className="admin-form-grid-2">
            <div>
              <label htmlFor="field-access-level" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: themeTokens.colors.textSecondary, marginBottom: '0.375rem' }}>
                Entitlement Access Level Tier
              </label>
              <select
                id="field-access-level"
                data-testid="select-access-level"
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as ComponentAccessLevel)}
                style={{ width: '100%' }}
              >
                <option value="free">Free Tier (Publicly accessible)</option>
                <option value="premium">Premium (Enterprise license required)</option>
              </select>
            </div>

            <div>
              <label htmlFor="field-status" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: themeTokens.colors.textSecondary, marginBottom: '0.375rem' }}>
                Publication Status
              </label>
              <select
                id="field-status"
                data-testid="select-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ComponentStatus)}
                style={{ width: '100%' }}
              >
                <option value="draft">Draft (Hidden from consumer catalogue)</option>
                <option value="published">Published (Live in catalogue)</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 2: STRUCTURED PROPS & USAGE DOCUMENTATION */}
        <section className="admin-form-section" aria-labelledby="section-2-heading">
          <div className="admin-section-header">
            <div className="admin-section-header-left">
              <div className="admin-section-badge">2</div>
              <div>
                <h2 id="section-2-heading" className="admin-section-title">
                  Structured Props &amp; Usage Documentation
                </h2>
                <p className="admin-section-subtitle">
                  Structured type specifications validated against component props for interactive preview &amp; documentation.
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddProp} data-testid="add-prop-button">
              + Add Prop Field
            </Button>
          </div>

          {propsList.length === 0 ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: themeTokens.colors.backgroundSubtle,
                borderRadius: '8px',
                color: themeTokens.colors.textMuted,
                fontSize: '0.875rem',
              }}
            >
              No custom props defined. Click &ldquo;+ Add Prop Field&rdquo; to add prop specifications.
            </div>
          ) : (
            <div>
              {/* Desktop Column Header Labels */}
              <div className="admin-prop-headers">
                <div>Prop Name</div>
                <div>Type</div>
                <div>Default Value</div>
                <div>Req?</div>
                <div>Description</div>
                <div style={{ textAlign: 'center' }}>Remove</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {propsList.map((p, index) => (
                  <div
                    key={p.id}
                    data-testid={`prop-row-${index}`}
                    className="admin-prop-card"
                  >
                    <input
                      type="text"
                      placeholder="Prop name (e.g. variant)"
                      value={p.name}
                      data-testid={`prop-name-${index}`}
                      onChange={(e) => handleUpdateProp(index, 'name', e.target.value)}
                      className="admin-prop-name"
                      style={{ width: '100%', fontSize: '0.8125rem' }}
                    />
                    <input
                      type="text"
                      placeholder="Type (e.g. 'primary' | 'outline')"
                      value={p.type}
                      data-testid={`prop-type-${index}`}
                      onChange={(e) => handleUpdateProp(index, 'type', e.target.value)}
                      className="admin-prop-type"
                      style={{ width: '100%', fontSize: '0.8125rem', fontFamily: 'monospace' }}
                    />
                    <input
                      type="text"
                      placeholder="Default (e.g. 'primary')"
                      value={p.defaultValue}
                      data-testid={`prop-default-${index}`}
                      onChange={(e) => handleUpdateProp(index, 'defaultValue', e.target.value)}
                      className="admin-prop-default"
                      style={{ width: '100%', fontSize: '0.8125rem' }}
                    />
                    <label
                      className="admin-prop-req"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.8125rem',
                        color: themeTokens.colors.textSecondary,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={p.required}
                        data-testid={`prop-required-${index}`}
                        onChange={(e) => handleUpdateProp(index, 'required', e.target.checked)}
                        style={{ accentColor: themeTokens.colors.primary, cursor: 'pointer' }}
                      />
                      <span>Req?</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Description of prop function"
                      value={p.description}
                      data-testid={`prop-desc-${index}`}
                      onChange={(e) => handleUpdateProp(index, 'description', e.target.value)}
                      className="admin-prop-desc"
                      style={{ width: '100%', fontSize: '0.8125rem' }}
                    />
                    <div className="admin-prop-remove">
                      <button
                        type="button"
                        onClick={() => handleRemoveProp(index)}
                        data-testid={`remove-prop-${index}`}
                        title="Remove Prop"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          fontSize: '1.25rem',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          lineHeight: 1,
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* SECTION 3: DECLARED DEPENDENCIES */}
        <section className="admin-form-section" aria-labelledby="section-3-heading">
          <div className="admin-section-header">
            <div className="admin-section-header-left">
              <div className="admin-section-badge">3</div>
              <div>
                <h2 id="section-3-heading" className="admin-section-title">
                  Declared Dependencies
                </h2>
                <p className="admin-section-subtitle">
                  External npm dependencies and peer libraries required for component execution.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {dependencies.map((dep) => (
              <span
                key={dep}
                data-testid={`dep-chip-${dep}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.75rem',
                  backgroundColor: themeTokens.colors.backgroundSubtle,
                  border: `1px solid ${themeTokens.colors.border}`,
                  borderRadius: '9999px',
                  fontSize: '0.8125rem',
                  fontFamily: 'monospace',
                  color: themeTokens.colors.primary,
                }}
              >
                {dep}
                <button
                  type="button"
                  onClick={() => handleRemoveDependency(dep)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: themeTokens.colors.textMuted,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    lineHeight: 1,
                    padding: 0,
                  }}
                  title={`Remove ${dep}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '440px', width: '100%' }}>
            <input
              type="text"
              placeholder="e.g. lucide-react, framer-motion"
              value={newDepInput}
              data-testid="input-new-dep"
              onChange={(e) => setNewDepInput(e.target.value)}
              onKeyDown={handleAddDependency}
              style={{ flex: 1 }}
            />
            <Button type="button" variant="secondary" size="sm" onClick={handleAddDependency} data-testid="add-dep-button">
              Add
            </Button>
          </div>
        </section>

        {/* SECTION 4: BUNDLE UPLOAD CONTROL */}
        <section className="admin-form-section" aria-labelledby="section-4-heading">
          <div className="admin-section-header">
            <div className="admin-section-header-left">
              <div className="admin-section-badge">4</div>
              <div>
                <h2 id="section-4-heading" className="admin-section-title">
                  Component Bundle Upload (JSON Bundle Format)
                </h2>
                <p className="admin-section-subtitle">
                  Upload raw component source files packaged as a documented JSON bundle (<code>&#123; files: [&#123; path, content &#125;], meta: &#123; ... &#125; &#125;</code>).
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '1.5rem',
              border: `2px dashed ${bundleData ? themeTokens.colors.primary : themeTokens.colors.border}`,
              borderRadius: '8px',
              backgroundColor: bundleData ? 'rgba(0, 181, 98, 0.05)' : themeTokens.colors.backgroundSubtle,
              textAlign: 'center',
            }}
          >
            <input
              type="file"
              id="bundle-file-input"
              data-testid="bundle-file-input"
              accept=".json,application/json"
              onChange={handleBundleFileUpload}
              style={{ display: 'none' }}
            />
            <label
              htmlFor="bundle-file-input"
              style={{
                display: 'inline-block',
                cursor: 'pointer',
                padding: '0.5rem 1.25rem',
                backgroundColor: themeTokens.colors.surfaceElevated,
                border: `1px solid ${themeTokens.colors.border}`,
                borderRadius: '6px',
                color: themeTokens.colors.textPrimary,
                fontSize: '0.875rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
              }}
            >
              Select JSON Bundle File...
            </label>

            {bundleFileName && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: themeTokens.colors.textSecondary }}>
                Selected file: <strong>{bundleFileName}</strong>
              </div>
            )}

            {bundleSummary && (
              <div
                data-testid="bundle-success-summary"
                style={{
                  marginTop: '0.75rem',
                  padding: '0.625rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '6px',
                  color: '#34D399',
                  fontSize: '0.8125rem',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                ✓ Valid JSON Bundle verified: <strong>{bundleSummary.fileCount} files</strong> (
                {(bundleSummary.totalSize / 1024).toFixed(1)} KB total payload)
                <div style={{ marginTop: '0.5rem' }}>
                  <Button type="button" variant="outline" size="sm" onClick={handleApplyBundleMeta}>
                    Auto-Fill Form from Bundle Meta
                  </Button>
                </div>
              </div>
            )}

            {bundleError && (
              <ErrorMessage
                data-testid="bundle-error"
                error={bundleError}
                message={bundleError}
                style={{ marginTop: '0.75rem' }}
              />
            )}
          </div>
        </section>

        {/* SECTION 5: PREVIEW BEFORE PUBLISH */}
        <section className="admin-form-section" aria-labelledby="section-5-heading">
          <div className="admin-section-header">
            <div className="admin-section-header-left">
              <div className="admin-section-badge">5</div>
              <div>
                <h2 id="section-5-heading" className="admin-section-title">
                  Preview &amp; Validate Before Publish
                </h2>
                <p className="admin-section-subtitle">
                  Perform schema validation against the server and interactively inspect the component using the shared catalogue preview renderer.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Button
                type="button"
                variant={showPreview ? 'secondary' : 'primary'}
                onClick={handlePreviewValidate}
                disabled={previewLoading}
                data-testid="preview-validate-button"
              >
                {previewLoading
                  ? 'Validating Preview...'
                  : showPreview
                  ? 'Re-Validate & Refresh Preview'
                  : 'Preview & Validate Before Publish'}
              </Button>
              {showPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                  data-testid="hide-preview-button"
                >
                  Hide Preview
                </Button>
              )}
            </div>
          </div>

          {previewError && (
            <ErrorMessage
              data-testid="preview-error"
              error={previewError}
              message={previewError}
              style={{ marginBottom: '1rem' }}
            />
          )}

          {previewSuccessMessage && (
            <div
              data-testid="preview-success-banner"
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '6px',
                color: '#34D399',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>✓</span>
              <span>{previewSuccessMessage}</span>
            </div>
          )}

          {showPreview && previewComponent && (
            <div
              data-testid="preview-before-publish-section"
              style={{
                marginTop: '1rem',
                border: `1px solid ${themeTokens.colors.border}`,
                borderRadius: '8px',
                padding: '1.25rem',
                backgroundColor: themeTokens.colors.backgroundSubtle,
              }}
            >
              {/* Pre-Publish Specification Checklist */}
              <div
                data-testid="pre-publish-checklist"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: themeTokens.colors.surfaceElevated,
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.borderMuted}`,
                  fontSize: '0.8125rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <span style={{ color: themeTokens.colors.textMuted }}>Slug: </span>
                  <strong style={{ color: themeTokens.colors.textPrimary }}>{previewComponent.slug}</strong>
                </div>
                <div>
                  <span style={{ color: themeTokens.colors.textMuted }}>Category: </span>
                  <strong style={{ color: themeTokens.colors.textPrimary }}>{previewComponent.category}</strong>
                </div>
                <div>
                  <span style={{ color: themeTokens.colors.textMuted }}>Version: </span>
                  <strong style={{ color: themeTokens.colors.textPrimary }}>v{previewComponent.version}</strong>
                </div>
                <div>
                  <span style={{ color: themeTokens.colors.textMuted }}>Access Level: </span>
                  <span className={`badge ${previewComponent.accessLevel === 'premium' ? 'badge-primary' : 'badge-secondary'}`}>
                    {previewComponent.accessLevel.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span style={{ color: themeTokens.colors.textMuted }}>Status: </span>
                  <span className={`badge ${previewComponent.status === 'published' ? 'badge-success' : 'badge-secondary'}`}>
                    {previewComponent.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span style={{ color: themeTokens.colors.textMuted }}>Props: </span>
                  <strong style={{ color: themeTokens.colors.textPrimary }}>{Object.keys(previewComponent.props || {}).length} defined</strong>
                </div>
              </div>

              {/* Shared LiveComponentPreview from ui-theme */}
              <LiveComponentPreview component={previewComponent} />
            </div>
          )}
        </section>

        {/* STICKY ACTION BAR */}
        <div className="admin-form-sticky-bar" data-testid="form-sticky-action-bar">
          <div className="admin-sticky-bar-info">
            <span className={`badge ${status === 'published' ? 'badge-success' : 'badge-secondary'}`}>
              {status === 'published' ? 'Published' : 'Draft'}
            </span>
            <span className={`badge ${accessLevel === 'premium' ? 'badge-warning' : 'badge-info'}`}>
              {accessLevel === 'premium' ? '★ Premium' : 'Free Tier'}
            </span>
            <span
              style={{
                fontSize: '0.875rem',
                color: themeTokens.colors.textSecondary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {name || slug ? (
                <>
                  <strong style={{ color: themeTokens.colors.textPrimary }}>{name || slug}</strong>
                  {version && <span style={{ color: themeTokens.colors.textMuted }}> (v{version})</span>}
                </>
              ) : (
                <span style={{ color: themeTokens.colors.textMuted }}>New Component Specification</span>
              )}
            </span>
          </div>

          <div className="admin-sticky-bar-actions">
            <Link to="/components">
              <Button type="button" variant="secondary" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handlePreviewValidate}
              disabled={previewLoading}
              data-testid="preview-validate-footer-button"
            >
              {previewLoading ? 'Validating...' : 'Preview Before Publish'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
              data-testid="submit-component-button"
            >
              {submitting
                ? 'Validating & Saving...'
                : mode === 'create'
                ? 'Create Component'
                : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
