import { test, expect } from '@playwright/test';

test.describe('Admin Route Guards & UI Smoke Tests', () => {
  const protectedPages = [
    '/',
    '/components',
    '/components/new',
    '/components/sample-slug/edit',
    '/customers',
  ];

  test.describe('1. Unauthenticated Browser Page Access Smoke Test', () => {
    test.beforeEach(async ({ page }) => {
      // Mock /admin/me returning 401 Unauthorized
      await page.route('**/admin/me', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'error',
            message: 'Admin authentication required. Please log in.',
          }),
        });
      });
    });

    for (const routePath of protectedPages) {
      test(`Unauthenticated request to page '${routePath}' is rejected and redirected to /login`, async ({
        page,
      }) => {
        await page.goto(routePath);
        await expect(page).toHaveURL(/.*\/login/);
        await expect(page.locator('h1')).toContainText('Admin Console Login');

        // Confirm protected page data is never rendered
        await expect(page.locator('[data-testid="dashboard-page"]')).not.toBeVisible();
        await expect(page.locator('[data-testid="customers-page"]')).not.toBeVisible();
        await expect(page.locator('.admin-table')).not.toBeVisible();
      });
    }
  });

  test.describe('2. Non-Admin (Customer Session) Page Access Smoke Test', () => {
    test.beforeEach(async ({ page }) => {
      // Mock /admin/me returning a non-admin customer identity
      await page.route('**/admin/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              admin: {
                id: 'cust_normal_user',
                email: 'customer@standard.org',
                role: 'customer',
                isAdmin: false,
              },
            },
          }),
        });
      });
    });

    for (const routePath of protectedPages) {
      test(`Non-admin request to page '${routePath}' is rejected and redirected to /login`, async ({
        page,
      }) => {
        await page.goto(routePath);
        await expect(page).toHaveURL(/.*\/login/);
        await expect(page.locator('h1')).toContainText('Admin Console Login');

        // Verify protected table/dashboard are not mounted
        await expect(page.locator('[data-testid="dashboard-page"]')).not.toBeVisible();
        await expect(page.locator('[data-testid="customers-page"]')).not.toBeVisible();
      });
    }
  });

  test.describe('3. Accessibility, Skip Link & Keyboard Navigation Smoke Test', () => {
    test.beforeEach(async ({ page }) => {
      // Authenticate as valid admin
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
            data: { components: [] },
          }),
        });
      });

      await page.route('**/admin/customers', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: { customers: [] },
          }),
        });
      });
    });

    test('Skip-to-content link receives focus on first Tab and navigates to main landmark', async ({
      page,
    }) => {
      await page.goto('/');

      // Wait for layout to mount
      await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();

      // Press Tab key from page top
      await page.keyboard.press('Tab');

      const skipLink = page.locator('[data-testid="skip-link"]');
      await expect(skipLink).toBeFocused();
      await expect(skipLink).toContainText('Skip to main content');

      // Press Enter on skip link
      await page.keyboard.press('Enter');

      // Verify main landmark receives focus
      const main = page.locator('#admin-main-content');
      await expect(main).toBeFocused();
    });

    test('Dashboard renders empty state and error state with keyboard retry control', async ({
      page,
    }) => {
      // 1. Empty state: 0 components in catalogue
      await page.goto('/');
      await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
      await expect(page.locator('text=No Components in Catalogue')).toBeVisible();
      await expect(page.locator('[data-testid="empty-cta-create"]')).toBeVisible();

      // 2. Error state: network or server failure
      await page.route('**/admin/components', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'error', message: 'Internal Database Gateway Timeout' }),
        });
      });

      await page.goto('/');
      await expect(page.locator('[data-testid="dashboard-error"]')).toBeVisible();
      const retryBtn = page.locator('[data-testid="retry-dashboard-btn"]');
      await expect(retryBtn).toBeVisible();

      // Focus retry button and verify keyboard operability
      await retryBtn.focus();
      await expect(retryBtn).toBeFocused();
    });

    test('Components directory renders loading, empty, and error states with keyboard controls', async ({
      page,
    }) => {
      // 1. Empty state
      await page.goto('/components');
      await expect(page.locator('[data-testid="components-empty"]')).toBeVisible();

      // 2. Error state with retry
      await page.route('**/admin/components', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'error', message: 'Database disconnected' }),
        });
      });

      await page.goto('/components');
      await expect(page.locator('[data-testid="components-error"]')).toBeVisible();
      const retryBtn = page.locator('[data-testid="retry-components-btn"]');
      await expect(retryBtn).toBeVisible();
      await retryBtn.focus();
      await expect(retryBtn).toBeFocused();
    });

    test('Component edit page renders error state with return link when component not found', async ({
      page,
    }) => {
      await page.goto('/components/non-existent-component/edit');
      await expect(page.locator('[data-testid="edit-error"]')).toBeVisible();
      await expect(page.locator('text=Component Not Found')).toBeVisible();
      const returnBtn = page.locator('[data-testid="return-components-btn"]');
      await expect(returnBtn).toBeVisible();
      await returnBtn.focus();
      await expect(returnBtn).toBeFocused();
    });
  });
});
