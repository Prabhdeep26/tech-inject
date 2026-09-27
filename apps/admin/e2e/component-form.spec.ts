import { test, expect } from '@playwright/test';

test.describe('Admin Component Create & Edit Forms', () => {
  const existingComponents = [
    {
      id: 'comp_btn_primary',
      slug: 'action-button',
      name: 'Interactive Action Button',
      description: 'High performance button with animations.',
      category: 'Buttons',
      version: '1.0.0',
      accessLevel: 'free',
      status: 'published',
      dependencies: ['react', '@tech-inject/ui-theme'],
      props: {
        variant: { name: 'variant', type: "'primary' | 'secondary'", defaultValue: 'primary', required: false, description: 'Button style' },
        size: { name: 'size', type: "'sm' | 'md' | 'lg'", defaultValue: 'md', required: false, description: 'Button sizing' },
      },
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Authenticate as admin
    await page.route('**/admin/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            admin: {
              id: 'admin-root',
              email: 'admin@tech-inject.internal',
              role: 'admin',
              isAdmin: true,
            },
          },
        }),
      });
    });

    // Provide existing components list for uniqueness check
    await page.route('**/admin/components', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              components: existingComponents,
              pagination: { total: 1, page: 1, limit: 50, totalPages: 1 },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('Create Form: auto-suggests slug, validates uniqueness, edits structured props, and submits', async ({ page }) => {
    let capturedPayload: any = null;

    await page.route('**/admin/components', async (route) => {
      if (route.request().method() === 'POST') {
        capturedPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              component: {
                id: 'comp_new_badge',
                ...capturedPayload,
              },
            },
          }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              components: existingComponents,
              pagination: { total: 1, page: 1, limit: 50, totalPages: 1 },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/components/new');
    await expect(page.locator('h1')).toContainText('Create New Component');

    // 1. Auto-suggest slug from name
    await page.fill('[data-testid="input-name"]', 'Status Notification Badge');
    await expect(page.locator('[data-testid="input-slug"]')).toHaveValue('status-notification-badge');

    // 2. Validate slug uniqueness inline
    await page.fill('[data-testid="input-slug"]', 'action-button');
    await expect(page.locator('[data-testid="slug-error"]')).toContainText('already in use');

    // Restore unique slug
    await page.fill('[data-testid="input-slug"]', 'status-badge');
    await expect(page.locator('[data-testid="slug-error"]')).not.toBeVisible();

    // 3. Fill required description, category, and version
    await page.fill('[data-testid="textarea-description"]', 'A versatile notification status indicator with pulse animation.');
    await page.selectOption('[data-testid="select-category"]', 'Feedback');
    await page.fill('[data-testid="input-version"]', '1.2.0');
    await page.selectOption('[data-testid="select-access-level"]', 'premium');

    // 4. Structured props manipulation: Add new prop
    await page.click('[data-testid="add-prop-button"]');
    // The newly added prop will be at index 2 (after the 2 defaults)
    await page.fill('[data-testid="prop-name-2"]', 'pulse');
    await page.fill('[data-testid="prop-type-2"]', 'boolean');
    await page.fill('[data-testid="prop-default-2"]', 'false');
    await page.check('[data-testid="prop-required-2"]');
    await page.fill('[data-testid="prop-desc-2"]', 'Enable glowing pulse effect');

    // 5. Add custom dependency
    await page.fill('[data-testid="input-new-dep"]', 'framer-motion');
    await page.click('[data-testid="add-dep-button"]');
    await expect(page.locator('[data-testid="dep-chip-framer-motion"]')).toBeVisible();

    // 6. Submit form
    await page.click('[data-testid="submit-component-button"]');

    // 7. Verify navigation and payload sent to server
    await expect(page).toHaveURL(/.*\/components/);
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.name).toBe('Status Notification Badge');
    expect(capturedPayload.slug).toBe('status-badge');
    expect(capturedPayload.category).toBe('Feedback');
    expect(capturedPayload.version).toBe('1.2.0');
    expect(capturedPayload.accessLevel).toBe('premium');
    expect(capturedPayload.dependencies).toContain('framer-motion');
    expect(capturedPayload.props.pulse).toEqual({
      name: 'pulse',
      type: 'boolean',
      defaultValue: 'false',
      required: true,
      description: 'Enable glowing pulse effect',
    });
  });

  test('Edit Form: populates existing component data and sends PATCH update', async ({ page }) => {
    let patchPayload: any = null;

    await page.route('**/admin/components/*', async (route) => {
      if (route.request().method() === 'PATCH') {
        patchPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              component: {
                ...existingComponents[0],
                ...patchPayload,
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/components/comp_btn_primary/edit');
    await expect(page.locator('h1')).toContainText('Edit Component');

    // Verify prefilled values
    await expect(page.locator('[data-testid="input-name"]')).toHaveValue('Interactive Action Button');
    await expect(page.locator('[data-testid="input-slug"]')).toHaveValue('action-button');
    await expect(page.locator('[data-testid="select-category"]')).toHaveValue('Buttons');

    // Edit fields
    await page.fill('[data-testid="input-name"]', 'Interactive Action Button V2');
    await page.fill('[data-testid="input-version"]', '1.1.0');
    await page.selectOption('[data-testid="select-status"]', 'published');

    // Submit changes
    await page.click('[data-testid="submit-component-button"]');

    // Should redirect to /components
    await expect(page).toHaveURL(/.*\/components/);
    expect(patchPayload).not.toBeNull();
    expect(patchPayload.name).toBe('Interactive Action Button V2');
    expect(patchPayload.version).toBe('1.1.0');
  });

  test('Bundle Upload: parses JSON bundle and uploads via POST /admin/bundles', async ({ page }) => {
    let bundleUploadedPayload: any = null;

    await page.route('**/admin/bundles', async (route) => {
      bundleUploadedPayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            component: {
              id: 'comp_grid',
              slug: 'sample-grid',
              name: 'Sample Grid',
            },
          },
        }),
      });
    });

    await page.goto('/components/new');

    const sampleBundle = {
      files: [
        { path: 'index.tsx', content: 'export const SampleGrid = () => <div>Grid</div>;' },
        { path: 'styles.css', content: '.grid { display: flex; }' },
      ],
      meta: {
        slug: 'sample-grid',
        name: 'Sample Grid',
        description: 'A sample grid component bundle.',
        category: 'Data Tables',
        version: '1.0.0',
        accessLevel: 'free',
        status: 'draft',
      },
    };

    // Upload JSON file via bundle file input
    await page.setInputFiles('[data-testid="bundle-file-input"]', {
      name: 'sample-grid-bundle.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(sampleBundle)),
    });

    // Check bundle success summary
    await expect(page.locator('[data-testid="bundle-success-summary"]')).toContainText('2 files');

    // Auto-fill form from bundle meta
    await page.click('button:has-text("Auto-Fill Form from Bundle Meta")');
    await expect(page.locator('[data-testid="input-name"]')).toHaveValue('Sample Grid');
    await expect(page.locator('[data-testid="input-slug"]')).toHaveValue('sample-grid');

    // Submit form with bundle
    await page.click('[data-testid="submit-component-button"]');

    await expect(page).toHaveURL(/.*\/components/);
    expect(bundleUploadedPayload).not.toBeNull();
    expect(bundleUploadedPayload.files).toHaveLength(2);
    expect(bundleUploadedPayload.meta.slug).toBe('sample-grid');
  });

  test('Preview Before Publish: validates component via POST /admin/components/validate and renders shared live preview', async ({ page }) => {
    let validateCalledWith: any = null;

    await page.route('**/admin/components/validate', async (route) => {
      validateCalledWith = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Server validation passed: Component specification verified. Ready for visual review.',
          data: {
            valid: true,
            component: {
              slug: validateCalledWith.slug,
              name: validateCalledWith.name,
              description: validateCalledWith.description,
              category: validateCalledWith.category,
              version: validateCalledWith.version,
              accessLevel: validateCalledWith.accessLevel,
              status: validateCalledWith.status,
              props: validateCalledWith.props,
              dependencies: validateCalledWith.dependencies,
            },
          },
        }),
      });
    });

    await page.goto('/components/new');

    // Fill in required fields
    await page.fill('[data-testid="input-name"]', 'Telemetry Chart Card');
    await page.fill('[data-testid="textarea-description"]', 'Realtime metrics visualization with live stream.');
    await page.selectOption('[data-testid="select-category"]', 'Cards');

    // Click Preview & Validate Before Publish
    await page.click('[data-testid="preview-validate-button"]');

    // Verify endpoint called
    expect(validateCalledWith).not.toBeNull();
    expect(validateCalledWith.slug).toBe('telemetry-chart-card');
    expect(validateCalledWith.name).toBe('Telemetry Chart Card');

    // Verify success banner and checklist
    await expect(page.locator('[data-testid="preview-success-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-before-publish-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="pre-publish-checklist"]')).toContainText('telemetry-chart-card');
    await expect(page.locator('[data-testid="pre-publish-checklist"]')).toContainText('Cards');

    // Verify live preview rendered from @tech-inject/ui-theme
    await expect(page.locator('text=Variant Switcher:')).toBeVisible();
    await expect(page.locator('text=Streaming Telemetry Ingestion')).toBeVisible();

    // Verify toggle/hide preview works
    await page.click('[data-testid="hide-preview-button"]');
    await expect(page.locator('[data-testid="preview-before-publish-section"]')).not.toBeVisible();
  });

  test('Preview Before Publish with Bundle: validates uploaded bundle via POST /admin/bundles/validate and displays live preview', async ({ page }) => {
    let bundleValidatePayload: any = null;

    await page.route('**/admin/bundles/validate', async (route) => {
      bundleValidatePayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Component bundle validated successfully. Ready for pre-publish visual confirmation.',
          data: {
            valid: true,
            component: {
              slug: bundleValidatePayload.meta.slug,
              name: bundleValidatePayload.meta.name,
              description: bundleValidatePayload.meta.description,
              category: bundleValidatePayload.meta.category,
              version: bundleValidatePayload.meta.version,
              accessLevel: bundleValidatePayload.meta.accessLevel,
              status: bundleValidatePayload.meta.status,
              props: bundleValidatePayload.meta.props,
              dependencies: bundleValidatePayload.meta.dependencies,
            },
            bundleMetrics: {
              fileCount: bundleValidatePayload.files.length,
              totalSize: 1200,
            },
          },
        }),
      });
    });

    await page.goto('/components/new');

    const sampleBundle = {
      files: [
        { path: 'index.tsx', content: 'export const MetricCard = () => <div>Metrics</div>;' },
        { path: 'styles.css', content: '.card { padding: 16px; }' },
      ],
      meta: {
        slug: 'admin-metric-card',
        name: 'Admin Metric Card',
        description: 'Interactive dashboard metric card with status indicators.',
        category: 'Cards',
        version: '1.2.0',
        accessLevel: 'premium',
        status: 'published',
      },
    };

    // Upload JSON bundle
    await page.setInputFiles('[data-testid="bundle-file-input"]', {
      name: 'admin-metric-card.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(sampleBundle)),
    });

    // Auto-fill from meta
    await page.click('button:has-text("Auto-Fill Form from Bundle Meta")');

    // Trigger preview validation
    await page.click('[data-testid="preview-validate-button"]');

    // Assert bundle validate endpoint was called
    expect(bundleValidatePayload).not.toBeNull();
    expect(bundleValidatePayload.files).toHaveLength(2);
    expect(bundleValidatePayload.meta.slug).toBe('admin-metric-card');

    // Assert preview container is visible with checklist
    await expect(page.locator('[data-testid="preview-before-publish-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="pre-publish-checklist"]')).toContainText('admin-metric-card');
    await expect(page.locator('[data-testid="pre-publish-checklist"]')).toContainText('PREMIUM');
    await expect(page.locator('[data-testid="pre-publish-checklist"]')).toContainText('PUBLISHED');
  });

  test('Preview Before Publish: displays server validation error when endpoint rejects specification', async ({ page }) => {
    await page.route('**/admin/components/validate', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'error',
          statusCode: 400,
          message: 'Component validation failed: Invalid semver version structure.',
        }),
      });
    });

    await page.goto('/components/new');

    await page.fill('[data-testid="input-name"]', 'Invalid Component');
    await page.fill('[data-testid="textarea-description"]', 'Description text.');

    await page.click('[data-testid="preview-validate-button"]');

    await expect(page.locator('[data-testid="preview-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-error"]')).toContainText('Component validation failed');
    await expect(page.locator('[data-testid="preview-before-publish-section"]')).not.toBeVisible();
  });

  test('Form redesign: groups fields into labeled, clearly separated sections', async ({ page }) => {
    await page.goto('/components/new');

    // 1. Verify section badges and titles
    const section1 = page.locator('section[aria-labelledby="section-1-heading"]');
    const section2 = page.locator('section[aria-labelledby="section-2-heading"]');
    const section3 = page.locator('section[aria-labelledby="section-3-heading"]');
    const section4 = page.locator('section[aria-labelledby="section-4-heading"]');
    const section5 = page.locator('section[aria-labelledby="section-5-heading"]');

    await expect(section1).toBeVisible();
    await expect(section1.locator('h2')).toContainText('Core Component Information');

    await expect(section2).toBeVisible();
    await expect(section2.locator('h2')).toContainText('Structured Props & Usage Documentation');

    await expect(section3).toBeVisible();
    await expect(section3.locator('h2')).toContainText('Declared Dependencies');

    await expect(section4).toBeVisible();
    await expect(section4.locator('h2')).toContainText('Component Bundle Upload');

    await expect(section5).toBeVisible();
    await expect(section5.locator('h2')).toContainText('Preview & Validate Before Publish');

    // 2. Verify all 5 sections use the .admin-form-section class
    const sectionsCount = await page.locator('.admin-form-section').count();
    expect(sectionsCount).toBe(5);
  });

  test('Form redesign: prop rows stack cleanly on mobile without horizontal overflow and sticky action bar remains reachable', async ({ page }) => {
    // 1. Set mobile viewport (375 x 667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/components/new');

    // Verify initial load
    await expect(page.locator('h1')).toContainText('Create New Component');

    // 2. Check no horizontal overflow on mobile
    const overflowCheck = await page.evaluate(() => {
      const docEl = document.documentElement;
      const overflowing: string[] = [];
      document.querySelectorAll('*').forEach((el) => {
        if (el.clientWidth > 0 && el.getBoundingClientRect().right > docEl.clientWidth + 1) {
          overflowing.push(`${el.tagName}.${el.className || ''}#${el.id || ''} (right: ${el.getBoundingClientRect().right}, clientWidth: ${docEl.clientWidth})`);
        }
      });
      return {
        docScrollWidth: docEl.scrollWidth,
        docClientWidth: docEl.clientWidth,
        hasHorizontalScroll: docEl.scrollWidth > docEl.clientWidth,
      };
    });
    expect(overflowCheck.hasHorizontalScroll).toBe(false);
    expect(overflowCheck.docScrollWidth).toBeLessThanOrEqual(overflowCheck.docClientWidth);

    // 3. Verify prop row does not overflow the mobile container
    const propRow0 = page.locator('[data-testid="prop-row-0"]');
    await expect(propRow0).toBeVisible();
    const propBox = await propRow0.boundingBox();
    expect(propBox).not.toBeNull();
    if (propBox) {
      expect(propBox.width).toBeLessThanOrEqual(375);
    }

    // Verify 'Req?' checkbox is visible and interactive
    const reqCheckbox = page.locator('[data-testid="prop-required-0"]');
    await expect(reqCheckbox).toBeVisible();
    await reqCheckbox.check();
    await expect(reqCheckbox).toBeChecked();

    // 4. Verify sticky action bar is visible and reachable without scrolling back up
    const stickyBar = page.locator('[data-testid="form-sticky-action-bar"]');
    await expect(stickyBar).toBeVisible();

    // Scroll down the long form to Section 3/4
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(100);

    // Sticky bar and submit button should still be in the visible viewport
    const submitBtn = page.locator('[data-testid="submit-component-button"]');
    await expect(submitBtn).toBeVisible();

    const submitBtnBox = await submitBtn.boundingBox();
    expect(submitBtnBox).not.toBeNull();
    if (submitBtnBox) {
      // Must be within current viewport height (667px)
      expect(submitBtnBox.y).toBeLessThan(667);
      expect(submitBtnBox.y).toBeGreaterThan(0);
    }
  });
});
