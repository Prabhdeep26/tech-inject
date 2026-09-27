import { test, expect } from '@playwright/test';

// Seeded Component Definitions
const FREE_COMPONENT = {
  id: 'comp_btn_primary',
  slug: 'action-button',
  name: 'Interactive Action Button',
  description: 'High-performance interactive button with glow animations, loading states, and icon slots.',
  category: 'Buttons',
  version: '1.0.0',
  accessLevel: 'free',
  status: 'published',
  dependencies: ['react', '@tech-inject/ui-theme'],
  props: {
    variant: { name: 'variant', type: "'primary' | 'secondary' | 'outline'", required: false },
    size: { name: 'size', type: "'sm' | 'md' | 'lg'", required: false },
  },
};

const PREMIUM_COMPONENT = {
  id: 'comp_premium_data_table',
  slug: 'pro-data-grid',
  name: 'Pro Virtualized Data Grid',
  description: 'Enterprise virtualized grid with column reordering, multi-column sorting, and row filtering.',
  category: 'Data Tables',
  version: '2.0.0',
  accessLevel: 'premium',
  status: 'published',
  dependencies: ['react', '@tech-inject/ui-theme'],
  props: {
    columns: { name: 'columns', type: 'ColumnDef[]', required: true },
    data: { name: 'data', type: 'T[]', required: true },
  },
};

test.describe('End-to-End Access-Control UI States', () => {
  // Helper to mock auth and components routes
  const setupRoutes = async (page: any, user: { id: string; email: string; isPremium: boolean } | null) => {
    // 1. Mock /auth/me
    await page.route('**/auth/me', (route: any) => {
      if (route.request().resourceType() === 'document') return route.continue();
      if (!user) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'error', message: 'Not authenticated' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            user: {
              _id: user.id,
              id: user.id,
              email: user.email,
              isAdmin: false,
              isPremium: user.isPremium,
            },
          },
        }),
      });
    });

    // 2. Mock /components (directory API)
    await page.route('**/components', (route: any) => {
      if (route.request().resourceType() === 'document') return route.continue();
      if (route.request().url().endsWith('/components')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              components: [FREE_COMPONENT, PREMIUM_COMPONENT],
            },
          }),
        });
      }
      return route.continue();
    });

    // 3. Mock /components/action-button (free component API)
    await page.route('**/components/action-button', (route: any) => {
      if (route.request().resourceType() === 'document') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: { component: FREE_COMPONENT },
        }),
      });
    });

    // 4. Mock /components/pro-data-grid (premium component API)
    await page.route('**/components/pro-data-grid', (route: any) => {
      if (route.request().resourceType() === 'document') return route.continue();
      const isLocked = !user || !user.isPremium;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            component: {
              ...PREMIUM_COMPONENT,
              isLocked,
              lockReason: isLocked
                ? 'Premium subscription required. Upgrade your account to unlock source code, bundle files, and full prop definitions.'
                : undefined,
            },
          },
        }),
      });
    });

    // 5. Mock /components/*/source
    await page.route('**/components/*/source', (route: any) => {
      if (route.request().resourceType() === 'document') return route.continue();
      const url = route.request().url();
      if (url.includes('pro-data-grid') && (!user || !user.isPremium)) {
        return route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'error',
            message: 'Access denied: Premium subscription required to view component source files.',
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            files: [
              { path: 'src/Component.tsx', content: 'export const Component = () => null;' },
              { path: 'package.json', content: '{"name": "test-pkg"}' },
            ],
          },
        }),
      });
    });
  };

  test('1. Signed-out users: see public/copy/install/prompt for free component, locked for premium', async ({ page }) => {
    await setupRoutes(page, null);

    // 1. Verify header shows only "Sign In" button when signed out (no status pill)
    await page.goto('/');
    await expect(page.locator('[data-testid="account-status-badge"]')).toHaveCount(0);
    await expect(page.locator('a:has-text("Sign In")')).toBeVisible();

    // 2. Go to /components catalogue and click into Free component: action-button
    await page.goto('/components');
    const freeCard = page.locator('[data-testid="card-action-button"]');
    await expect(freeCard).toBeVisible();
    await page.locator('[data-testid="view-details-action-button"]').click();

    // 3. Verify free component header and that UNLOCKED tabs panel is visible
    await expect(page.locator('h1')).toContainText('Interactive Action Button');
    const unlockedPanel = page.locator('[data-testid="unlocked-tabs-panel"]');
    await expect(unlockedPanel).toBeVisible();

    // Verify all 5 tab buttons exist: Preview, Props & Usage Docs, Copy Code, Copy Install, Copy Agent Prompt
    await expect(page.locator('[data-testid="tab-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-props"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-install"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-agent"]')).toBeVisible();

    // Verify clicking Copy Code tab renders code panel and copy action
    await page.locator('[data-testid="tab-code"]').click();
    await expect(page.locator('button:has-text("Copy All Files")')).toBeVisible();

    // Verify clicking Copy Install tab renders npx command
    await page.locator('[data-testid="tab-install"]').click();
    await expect(page.locator('button:has-text("Copy Command")')).toBeVisible();

    // Verify clicking Copy Agent Prompt tab renders prompt copy action
    await page.locator('[data-testid="tab-agent"]').click();
    await expect(page.locator('[data-testid="copy-prompt-btn"]')).toBeVisible();

    // Locked card should NOT be visible on free component
    await expect(page.locator('[data-testid="locked-card"]')).not.toBeVisible();

    // 4. Return to /components catalogue and click into Premium component: pro-data-grid
    await page.goto('/components');
    const premiumCard = page.locator('[data-testid="card-pro-data-grid"]');
    await expect(premiumCard).toBeVisible();
    await page.locator('[data-testid="view-details-pro-data-grid"]').click();

    // Verify premium component header
    await expect(page.locator('h1')).toContainText('Pro Virtualized Data Grid');

    // Locked card MUST be displayed explaining how premium access is obtained
    const lockedCard = page.locator('[data-testid="locked-card"]');
    await expect(lockedCard).toBeVisible();
    await expect(page.locator('[data-testid="locked-title"]')).toContainText('Premium Component Access Required');
    await expect(lockedCard).toContainText('How Premium Access Is Provisioned');
    await expect(lockedCard.locator('button:has-text("Sign In to Customer Account")')).toBeVisible();

    // Unlocked tabs panel should NOT be visible for signed-out user on premium component
    await expect(page.locator('[data-testid="unlocked-tabs-panel"]')).not.toBeVisible();
  });

  test('2. Signed-in Free users: see public/copy/install/prompt for free component, locked message for premium', async ({ page }) => {
    const freeUser = {
      id: 'usr_free_456',
      email: 'customer.free@example.com',
      isPremium: false,
    };
    await setupRoutes(page, freeUser);

    // 1. Verify header status indicator shows "Free Tier" and user email
    await page.goto('/');
    const statusBadge = page.locator('[data-testid="account-status-badge"]');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toContainText('Free Tier');
    await expect(page.locator('[data-testid="account-status"]')).toContainText('customer.free@example.com');
    await expect(page.locator('[data-testid="sign-out-btn"]')).toBeVisible();

    // 2. Navigate to Free component: action-button
    await page.goto('/components');
    await page.locator('[data-testid="view-details-action-button"]').click();
    await expect(page.locator('[data-testid="unlocked-tabs-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-install"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-agent"]')).toBeVisible();
    await expect(page.locator('[data-testid="locked-card"]')).not.toBeVisible();

    // 3. Navigate to Premium component: pro-data-grid
    await page.goto('/components');
    await page.locator('[data-testid="view-details-pro-data-grid"]').click();
    const lockedCard = page.locator('[data-testid="locked-card"]');
    await expect(lockedCard).toBeVisible();
    await expect(page.locator('[data-testid="locked-title"]')).toContainText('Premium Component Access Required');
    await expect(lockedCard).toContainText('Status: Free Tier');
    await expect(page.locator('[data-testid="unlocked-tabs-panel"]')).not.toBeVisible();
  });

  test('3. Signed-in Premium users: get full access to premium components (all tabs unlocked)', async ({ page }) => {
    const premiumUser = {
      id: 'usr_premium_789',
      email: 'enterprise.lead@example.com',
      isPremium: true,
    };
    await setupRoutes(page, premiumUser);

    // 1. Verify header status indicator shows "★ Premium" and user email
    await page.goto('/');
    const statusBadge = page.locator('[data-testid="account-status-badge"]');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toContainText('Premium');
    await expect(page.locator('[data-testid="account-status"]')).toContainText('enterprise.lead@example.com');
    await expect(page.locator('[data-testid="sign-out-btn"]')).toBeVisible();

    // 2. Navigate to Free component: action-button (fully accessible)
    await page.goto('/components');
    await page.locator('[data-testid="view-details-action-button"]').click();
    await expect(page.locator('[data-testid="unlocked-tabs-panel"]')).toBeVisible();

    // 3. Navigate to Premium component: pro-data-grid (FULL ACCESS UNLOCKED!)
    await page.goto('/components');
    await page.locator('[data-testid="view-details-pro-data-grid"]').click();
    await expect(page.locator('h1')).toContainText('Pro Virtualized Data Grid');

    // Locked card must NOT be visible for premium user
    await expect(page.locator('[data-testid="locked-card"]')).not.toBeVisible();

    // Unlocked tabs panel MUST be visible
    const unlockedPanel = page.locator('[data-testid="unlocked-tabs-panel"]');
    await expect(unlockedPanel).toBeVisible();

    // Verify all tabs are functional and interactive
    await expect(page.locator('[data-testid="tab-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-props"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-install"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-agent"]')).toBeVisible();

    // Click through tabs to verify premium user sees source code, install command, and agent prompt
    await page.locator('[data-testid="tab-code"]').click();
    await expect(page.locator('button:has-text("Copy All Files")')).toBeVisible();

    await page.locator('[data-testid="tab-install"]').click();
    await expect(page.locator('button:has-text("Copy Command")')).toBeVisible();

    await page.locator('[data-testid="tab-agent"]').click();
    await expect(page.locator('[data-testid="copy-prompt-btn"]')).toBeVisible();
  });
});
