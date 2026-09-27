import { test, expect } from '@playwright/test';

test.describe('Admin Customers Directory & Entitlements (/customers)', () => {
  const initialCustomers = [
    {
      id: 'cust_free_1',
      email: 'alex.developer@techcorp.io',
      isAdmin: false,
      isPremium: false,
    },
    {
      id: 'cust_prem_2',
      email: 'sarah.architect@cloudscale.net',
      isAdmin: false,
      isPremium: true,
    },
    {
      id: 'cust_free_3',
      email: 'marcus.lead@quantumai.dev',
      isAdmin: false,
      isPremium: false,
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Authenticate as admin via /admin/me
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
  });

  test('1. Fetches and displays customer list, emails, and entitlement statuses', async ({ page }) => {
    await page.route('**/admin/customers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            customers: initialCustomers,
            pagination: { total: 3, page: 1, limit: 50, totalPages: 1 },
          },
        }),
      });
    });

    await page.goto('/customers');
    await expect(page.locator('h1')).toContainText('Customer Entitlements');

    // Verify all 3 customers rendered
    await expect(page.locator('[data-testid="customer-row-cust_free_1"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-row-cust_prem_2"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-row-cust_free_3"]')).toBeVisible();

    // Verify email addresses
    await expect(page.locator('[data-testid="customer-email-cust_free_1"]')).toHaveText(
      'alex.developer@techcorp.io'
    );
    await expect(page.locator('[data-testid="customer-email-cust_prem_2"]')).toHaveText(
      'sarah.architect@cloudscale.net'
    );

    // Verify status badges
    await expect(page.locator('[data-testid="customer-status-cust_free_1"]')).toContainText('Free Tier');
    await expect(page.locator('[data-testid="customer-status-cust_prem_2"]')).toContainText('★ Premium Tier');

    // Verify appropriate action buttons
    await expect(page.locator('[data-testid="grant-premium-btn-cust_free_1"]')).toBeVisible();
    await expect(page.locator('[data-testid="revoke-premium-btn-cust_prem_2"]')).toBeVisible();
  });

  test('2. Grant Premium: performs optimistic UI update and persists on server success', async ({ page }) => {
    let grantEndpointCalled = false;

    await page.route('**/admin/customers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: { customers: initialCustomers },
        }),
      });
    });

    await page.route('**/admin/customers/cust_free_1/grant-premium', async (route) => {
      grantEndpointCalled = true;
      // Slight delay to verify optimistic update occurs before server returns
      await new Promise((resolve) => setTimeout(resolve, 150));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Premium status granted.',
          data: {
            customer: {
              id: 'cust_free_1',
              email: 'alex.developer@techcorp.io',
              isAdmin: false,
              isPremium: true,
            },
          },
        }),
      });
    });

    await page.goto('/customers');

    // Initial state: Free Tier
    await expect(page.locator('[data-testid="customer-status-cust_free_1"]')).toContainText('Free Tier');
    const grantBtn = page.locator('[data-testid="grant-premium-btn-cust_free_1"]');
    await expect(grantBtn).toHaveText('Grant Premium');

    // Click Grant Premium
    await grantBtn.click();

    // Verify optimistic transition: immediately switches to Premium Tier & Revoke button
    await expect(page.locator('[data-testid="customer-status-cust_free_1"]')).toContainText('★ Premium Tier');
    await expect(page.locator('[data-testid="revoke-premium-btn-cust_free_1"]')).toBeVisible();

    // Wait for network response and success banner
    await expect(page.locator('[data-testid="action-success-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="action-success-banner"]')).toContainText('Premium status successfully granted');
    expect(grantEndpointCalled).toBe(true);
  });

  test('3. Revoke Premium: performs optimistic UI update and persists on server success', async ({ page }) => {
    let revokeEndpointCalled = false;

    await page.route('**/admin/customers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: { customers: initialCustomers },
        }),
      });
    });

    await page.route('**/admin/customers/cust_prem_2/revoke-premium', async (route) => {
      revokeEndpointCalled = true;
      await new Promise((resolve) => setTimeout(resolve, 150));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Premium status revoked.',
          data: {
            customer: {
              id: 'cust_prem_2',
              email: 'sarah.architect@cloudscale.net',
              isAdmin: false,
              isPremium: false,
            },
          },
        }),
      });
    });

    await page.goto('/customers');

    // Initial state: Premium Tier
    await expect(page.locator('[data-testid="customer-status-cust_prem_2"]')).toContainText('★ Premium Tier');
    const revokeBtn = page.locator('[data-testid="revoke-premium-btn-cust_prem_2"]');
    await expect(revokeBtn).toHaveText('Revoke Premium');

    // Click Revoke Premium
    await revokeBtn.click();

    // Verify optimistic transition: switches immediately to Free Tier & Grant button
    await expect(page.locator('[data-testid="customer-status-cust_prem_2"]')).toContainText('Free Tier');
    await expect(page.locator('[data-testid="grant-premium-btn-cust_prem_2"]')).toBeVisible();

    // Wait for network response and success banner
    await expect(page.locator('[data-testid="action-success-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="action-success-banner"]')).toContainText('Premium status successfully revoked');
    expect(revokeEndpointCalled).toBe(true);
  });

  test('4. Optimistic UI with Error Rollback: rolls back state when endpoint fails', async ({ page }) => {
    await page.route('**/admin/customers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: { customers: initialCustomers },
        }),
      });
    });

    // Mock endpoint returning 500 error
    await page.route('**/admin/customers/cust_free_1/grant-premium', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'error',
          message: 'Database lock timeout. Cannot modify entitlement record.',
        }),
      });
    });

    await page.goto('/customers');

    // Initial state: Free Tier
    await expect(page.locator('[data-testid="customer-status-cust_free_1"]')).toContainText('Free Tier');

    // Click Grant Premium
    await page.click('[data-testid="grant-premium-btn-cust_free_1"]');

    // Verify rollback error banner appears
    await expect(page.locator('[data-testid="rollback-error-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="rollback-error-banner"]')).toContainText('Changes rolled back');
    await expect(page.locator('[data-testid="rollback-error-banner"]')).toContainText('Database lock timeout');

    // CRITICAL: Verify customer state is rolled back to original Free Tier and Grant button is restored
    await expect(page.locator('[data-testid="customer-status-cust_free_1"]')).toContainText('Free Tier');
    await expect(page.locator('[data-testid="grant-premium-btn-cust_free_1"]')).toBeVisible();
    await expect(page.locator('[data-testid="revoke-premium-btn-cust_free_1"]')).not.toBeVisible();
  });

  test('5. Search filtering and tier filtering works correctly', async ({ page }) => {
    await page.route('**/admin/customers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: { customers: initialCustomers },
        }),
      });
    });

    await page.goto('/customers');

    // Search by email
    await page.fill('[data-testid="search-input"]', 'quantumai');
    await expect(page.locator('[data-testid="customer-row-cust_free_3"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-row-cust_free_1"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="customer-row-cust_prem_2"]')).not.toBeVisible();

    // Clear search
    await page.fill('[data-testid="search-input"]', '');

    // Filter by Premium
    await page.click('[data-testid="filter-premium"]');
    await expect(page.locator('[data-testid="customer-row-cust_prem_2"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-row-cust_free_1"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="customer-row-cust_free_3"]')).not.toBeVisible();

    // Filter by Free
    await page.click('[data-testid="filter-free"]');
    await expect(page.locator('[data-testid="customer-row-cust_free_1"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-row-cust_free_3"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-row-cust_prem_2"]')).not.toBeVisible();
  });
});
