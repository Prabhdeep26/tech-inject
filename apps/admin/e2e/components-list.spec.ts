import { test, expect } from '@playwright/test';

test.describe('Admin Components Directory (/components)', () => {
  const initialComponents = [
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
    },
    {
      id: 'comp_data_grid',
      slug: 'pro-data-grid',
      name: 'Pro Virtualized Data Grid',
      description: 'Enterprise virtualized data table.',
      category: 'Data Tables',
      version: '2.1.0',
      accessLevel: 'premium',
      status: 'draft',
      dependencies: ['react', '@tech-inject/ui-theme'],
    },
  ];

  test('Displays all components (drafts & published), accessLevels, toggle publish, and edit link', async ({ page }) => {
    let components = JSON.parse(JSON.stringify(initialComponents));

    // 1. Mock /admin/me to authenticated
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

    // 2. Mock GET /admin/components
    await page.route('**/admin/components', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            components,
            pagination: { total: components.length, page: 1, limit: 50, totalPages: 1 },
          },
        }),
      });
    });

    // 3. Mock POST /admin/components/:id/publish
    await page.route('**/admin/components/*/publish', async (route) => {
      const url = route.request().url();
      const match = url.match(/\/admin\/components\/([^/]+)\/publish/);
      const id = match ? match[1] : '';

      const target = components.find((c: any) => c.id === id || c.slug === id);
      if (target) {
        target.status = 'published';
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: `Component '${id}' published successfully.`,
          data: { component: target },
        }),
      });
    });

    // 4. Mock POST /admin/components/:id/unpublish
    await page.route('**/admin/components/*/unpublish', async (route) => {
      const url = route.request().url();
      const match = url.match(/\/admin\/components\/([^/]+)\/unpublish/);
      const id = match ? match[1] : '';

      const target = components.find((c: any) => c.id === id || c.slug === id);
      if (target) {
        target.status = 'draft';
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: `Component '${id}' moved to draft.`,
          data: { component: target },
        }),
      });
    });

    // Navigate to /components
    await page.goto('/components');
    await expect(page.locator('h1')).toContainText('Components Directory');

    // Verify Row 1: Interactive Action Button (free, published)
    const actionRow = page.locator('[data-testid="row-action-button"]');
    await expect(actionRow).toBeVisible();
    await expect(page.locator('[data-testid="access-action-button"]')).toContainText('Free Tier');
    await expect(page.locator('[data-testid="status-action-button"]')).toContainText('Published');
    await expect(page.locator('[data-testid="toggle-publish-action-button"]')).toContainText('Unpublish');
    await expect(page.locator('[data-testid="edit-action-button"]')).toBeVisible();

    // Verify Row 2: Pro Virtualized Data Grid (premium, draft)
    const gridRow = page.locator('[data-testid="row-pro-data-grid"]');
    await expect(gridRow).toBeVisible();
    await expect(page.locator('[data-testid="access-pro-data-grid"]')).toContainText('★ Premium');
    await expect(page.locator('[data-testid="status-pro-data-grid"]')).toContainText('Draft');
    await expect(page.locator('[data-testid="toggle-publish-pro-data-grid"]')).toContainText('Publish');
    await expect(page.locator('[data-testid="edit-pro-data-grid"]')).toBeVisible();

    // Action: Publish the draft Pro Data Grid
    await page.locator('[data-testid="toggle-publish-pro-data-grid"]').click();
    // After publish, status should update to Published, button to Unpublish
    await expect(page.locator('[data-testid="status-pro-data-grid"]')).toContainText('Published');
    await expect(page.locator('[data-testid="toggle-publish-pro-data-grid"]')).toContainText('Unpublish');
    await expect(page.locator('[data-testid="feedback-alert"]')).toBeVisible();

    // Action: Unpublish the Interactive Action Button
    await page.locator('[data-testid="toggle-publish-action-button"]').click();
    await expect(page.locator('[data-testid="status-action-button"]')).toContainText('Draft');
    await expect(page.locator('[data-testid="toggle-publish-action-button"]')).toContainText('Publish');

    // Action: Click Edit on Pro Data Grid
    await page.locator('[data-testid="edit-pro-data-grid"]').click();
    await expect(page).toHaveURL(/.*\/components\/comp_data_grid\/edit/);
    await expect(page.locator('h1')).toContainText('Edit Component');
  });

  test('Filters components by search, status, and tier', async ({ page }) => {
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

    await page.route('**/admin/components', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            components: initialComponents,
            pagination: { total: 2, page: 1, limit: 50, totalPages: 1 },
          },
        }),
      });
    });

    await page.goto('/components');

    // 1. Search for "grid"
    await page.fill('[data-testid="search-input"]', 'grid');
    await expect(page.locator('[data-testid="row-pro-data-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="row-action-button"]')).not.toBeVisible();

    // Clear search
    await page.fill('[data-testid="search-input"]', '');
    await expect(page.locator('[data-testid="row-action-button"]')).toBeVisible();

    // 2. Filter by status: "draft"
    await page.click('[data-testid="filter-status-draft"]');
    await expect(page.locator('[data-testid="row-pro-data-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="row-action-button"]')).not.toBeVisible();

    // Reset status filter
    await page.click('[data-testid="filter-status-all"]');

    // 3. Filter by access tier: "premium"
    await page.click('[data-testid="filter-access-premium"]');
    await expect(page.locator('[data-testid="row-pro-data-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="row-action-button"]')).not.toBeVisible();
  });
});
