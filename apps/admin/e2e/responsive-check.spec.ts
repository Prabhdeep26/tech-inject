import { test, expect } from '@playwright/test';

test.describe('Admin Responsive Check (375px, 768px, 1280px)', () => {
  const VIEWPORTS = [
    { name: 'mobile-375px', width: 375, height: 667 },
    { name: 'tablet-768px', width: 768, height: 1024 },
    { name: 'desktop-1280px', width: 1280, height: 800 },
  ];

  const mockAdminAuth = async (page: any) => {
    await page.route('**/admin/me', async (route: any) => {
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

    await page.route('**/admin/components', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            components: [
              {
                id: 'comp_1',
                slug: 'action-button',
                name: 'Action Button',
                category: 'Buttons',
                version: '1.0.0',
                accessLevel: 'free',
                status: 'published',
                props: { variant: { name: 'variant', type: 'string', required: false } },
                dependencies: ['react'],
              },
              {
                id: 'comp_2',
                slug: 'metric-card',
                name: 'Analytics Metric Card',
                category: 'Cards',
                version: '2.1.0',
                accessLevel: 'premium',
                status: 'draft',
                props: { value: { name: 'value', type: 'number', required: true } },
                dependencies: ['react', 'recharts'],
              },
            ],
            pagination: { total: 2, page: 1, limit: 50, totalPages: 1 },
          },
        }),
      });
    });

    await page.route('**/admin/customers', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            customers: [
              { id: 'cust_1', email: 'alice@enterprise.com', isPremium: true, isAdmin: false },
              { id: 'cust_2', email: 'bob@startup.io', isPremium: false, isAdmin: false },
            ],
          },
        }),
      });
    });
  };

  const checkNoHorizontalScroll = async (page: any, pageLabel: string, width: number) => {
    const overflow = await page.evaluate(() => {
      const docEl = document.documentElement;
      return {
        docScrollWidth: docEl.scrollWidth,
        docClientWidth: docEl.clientWidth,
        hasHorizontalScroll: docEl.scrollWidth > docEl.clientWidth,
      };
    });

    expect(
      overflow.hasHorizontalScroll,
      `${pageLabel} at ${width}px width has horizontal scroll (scrollWidth: ${overflow.docScrollWidth}, clientWidth: ${overflow.docClientWidth})`
    ).toBe(false);
  };

  // 1. Admin Login Page across 375px, 768px, 1280px
  for (const vp of VIEWPORTS) {
    test(`Login Page at ${vp.name} (${vp.width}px): no overflow and comfortable touch targets`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');

      await expect(page.locator('h1')).toContainText('Admin Console Login');
      await checkNoHorizontalScroll(page, 'Login Page', vp.width);

      // Verify touch targets for input fields and submit button
      const emailInput = await page.locator('#admin-email').boundingBox();
      const passwordInput = await page.locator('#admin-password').boundingBox();
      const submitBtn = await page.locator('button:has-text("Sign In as Administrator")').boundingBox();

      expect(emailInput?.height).toBeGreaterThanOrEqual(38);
      expect(passwordInput?.height).toBeGreaterThanOrEqual(38);
      expect(submitBtn?.height).toBeGreaterThanOrEqual(40);
    });
  }

  // 2. Components List Page across 375px, 768px, 1280px
  for (const vp of VIEWPORTS) {
    test(`Components List Page at ${vp.name} (${vp.width}px): no overflow and comfortable touch targets`, async ({ page }) => {
      await mockAdminAuth(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/components');

      await expect(page.locator('h1')).toContainText('Components Directory');
      await checkNoHorizontalScroll(page, 'Components List Page', vp.width);

      // Verify search input touch target
      const searchBox = await page.locator('[data-testid="search-input"]').boundingBox();
      expect(searchBox?.height).toBeGreaterThanOrEqual(36);

      // Verify filter button touch targets
      const filterAll = await page.locator('[data-testid="filter-status-all"]').boundingBox();
      expect(filterAll?.height).toBeGreaterThanOrEqual(36);

      // Verify table action button touch targets
      const editBtn = await page.locator('[data-testid="edit-action-button"]').boundingBox();
      expect(editBtn?.height).toBeGreaterThanOrEqual(36);
    });
  }

  // 3. Component Form Page across 375px, 768px, 1280px
  for (const vp of VIEWPORTS) {
    test(`Component Form Page at ${vp.name} (${vp.width}px): no overflow, proper stacking, and sticky action bar`, async ({ page }) => {
      await mockAdminAuth(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/components/new');

      await expect(page.locator('h1')).toContainText('Create New Component');
      await checkNoHorizontalScroll(page, 'Component Form Page', vp.width);

      // Verify prop row bounding box stays within viewport width
      const propRow = await page.locator('[data-testid="prop-row-0"]').boundingBox();
      expect(propRow).not.toBeNull();
      if (propRow) {
        expect(propRow.width).toBeLessThanOrEqual(vp.width);
      }

      // Verify inputs have comfortable touch targets
      const nameInput = await page.locator('[data-testid="input-name"]').boundingBox();
      expect(nameInput?.height).toBeGreaterThanOrEqual(36);

      // Verify sticky action bar is accessible
      const stickyBar = page.locator('[data-testid="form-sticky-action-bar"]');
      await expect(stickyBar).toBeVisible();

      const submitBtn = page.locator('[data-testid="submit-component-button"]');
      await expect(submitBtn).toBeVisible();
      const submitBtnBox = await submitBtn.boundingBox();
      expect(submitBtnBox?.height).toBeGreaterThanOrEqual(38);
    });
  }

  // 4. Customers Page across 375px, 768px, 1280px
  for (const vp of VIEWPORTS) {
    test(`Customers Page at ${vp.name} (${vp.width}px): no overflow and comfortable touch targets`, async ({ page }) => {
      await mockAdminAuth(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/customers');

      await expect(page.locator('h1')).toContainText('Customer Entitlements');
      await checkNoHorizontalScroll(page, 'Customers Page', vp.width);

      // Verify search input touch target
      const searchBox = await page.locator('[data-testid="search-input"]').boundingBox();
      expect(searchBox?.height).toBeGreaterThanOrEqual(36);

      // Verify tier filter touch target
      const filterAll = await page.locator('[data-testid="filter-all"]').boundingBox();
      expect(filterAll?.height).toBeGreaterThanOrEqual(36);

      // Verify action buttons in table
      const actionBtn = page.locator('[data-testid="grant-premium-btn-cust_2"]');
      await expect(actionBtn).toBeVisible();
      const actionBtnBox = await actionBtn.boundingBox();
      expect(actionBtnBox?.height).toBeGreaterThanOrEqual(36);
    });
  }
});
