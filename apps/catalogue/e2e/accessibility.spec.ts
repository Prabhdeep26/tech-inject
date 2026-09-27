import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (axe-core) Audit', () => {
  test('Home page has no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Catalogue page has no accessibility violations', async ({ page }) => {
    await page.goto('/components');
    await page.waitForLoadState('networkidle');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Component detail page has no accessibility violations', async ({ page }) => {
    await page.goto('/components');
    await page.locator('[data-testid="view-details-action-button"]').click();
    await expect(page.locator('h1')).toBeVisible();
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Sign-in page has no accessibility violations', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.locator('h1')).toBeVisible();
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Keyboard Operability & Focus Navigation', () => {
  test('Skip-to-content link receives focus on first Tab and navigates to main-content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a.skip-link');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toHaveText('Skip to main content');

    // Press Enter to activate skip link
    await page.keyboard.press('Enter');
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();
  });

  test('Tab bar on Component Detail page supports ArrowRight and ArrowLeft keyboard cycling', async ({ page }) => {
    await page.goto('/components');
    await page.locator('[data-testid="view-details-action-button"]').click();
    await expect(page.locator('[data-testid="tab-preview"]')).toBeVisible();

    const previewTab = page.locator('[data-testid="tab-preview"]');
    const propsTab = page.locator('[data-testid="tab-props"]');
    const codeTab = page.locator('[data-testid="tab-code"]');

    // Focus initial active tab
    await previewTab.focus();
    await expect(previewTab).toHaveAttribute('aria-selected', 'true');

    // Press ArrowRight -> Moves to Props tab
    await page.keyboard.press('ArrowRight');
    await expect(propsTab).toBeFocused();
    await expect(propsTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-props')).toBeVisible();

    // Press ArrowRight -> Moves to Code tab
    await page.keyboard.press('ArrowRight');
    await expect(codeTab).toBeFocused();
    await expect(codeTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-code')).toBeVisible();

    // Press ArrowLeft -> Back to Props tab
    await page.keyboard.press('ArrowLeft');
    await expect(propsTab).toBeFocused();
    await expect(propsTab).toHaveAttribute('aria-selected', 'true');

    // Press End -> Jumps to last tab (agent)
    await page.keyboard.press('End');
    const agentTab = page.locator('[data-testid="tab-agent"]');
    await expect(agentTab).toBeFocused();
    await expect(agentTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-agent')).toBeVisible();

    // Press Home -> Jumps to first tab (preview)
    await page.keyboard.press('Home');
    await expect(previewTab).toBeFocused();
    await expect(previewTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-preview')).toBeVisible();

    // Verify visual active indicator is present on the selected tab
    await expect(previewTab.locator('.tab-active-indicator')).toBeVisible();
  });
});

test.describe('Responsive Narrow-Screen Layouts', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('Mobile navigation hamburger toggles menu drawer with proper ARIA states', async ({ page }) => {
    await page.goto('/');
    const menuToggle = page.locator('#mobile-menu-toggle');
    await expect(menuToggle).toBeVisible();
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');

    // Open mobile menu
    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
    const mobileDrawer = page.locator('#mobile-nav-menu');
    await expect(mobileDrawer).toBeVisible();

    // Verify axe compliance with mobile menu open
    const axeResults = await new AxeBuilder({ page }).analyze();
    expect(axeResults.violations).toEqual([]);

    // Close mobile menu
    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('Catalogue page adapts cleanly without horizontal viewport overflow on narrow screens', async ({ page }) => {
    await page.goto('/components');
    await page.waitForLoadState('networkidle');

    // Check no horizontal scrollbar overflow on body
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // allows minor subpixel rounding

    // Verify axe compliance on mobile catalogue
    const axeResults = await new AxeBuilder({ page }).analyze();
    expect(axeResults.violations).toEqual([]);
  });

  test('Component detail page tabs and code blocks adapt cleanly without horizontal viewport overflow on narrow screens', async ({ page }) => {
    await page.goto('/components');
    await page.locator('[data-testid="view-details-action-button"]').click();
    await expect(page.locator('[data-testid="tab-preview"]')).toBeVisible();

    const checkNoHorizontalOverflow = async () => {
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    };

    // 1. Check Preview Tab
    await checkNoHorizontalOverflow();

    // 2. Check Copy Code Tab with code blocks
    await page.locator('[data-testid="tab-code"]').click();
    await expect(page.locator('#panel-code')).toBeVisible();
    await checkNoHorizontalOverflow();

    // 3. Check Copy Install Tab with terminal command box
    await page.locator('[data-testid="tab-install"]').click();
    await expect(page.locator('#panel-install')).toBeVisible();
    await checkNoHorizontalOverflow();

    // 4. Check Copy Agent Prompt Tab
    await page.locator('[data-testid="tab-agent"]').click();
    await expect(page.locator('#panel-agent')).toBeVisible();
    await checkNoHorizontalOverflow();

    // Verify axe compliance across detail page on narrow screen
    const axeResults = await new AxeBuilder({ page }).analyze();
    expect(axeResults.violations).toEqual([]);
  });

  test('Component grid reflows correctly across breakpoints (1 column at 375px, 2 at 768px, 3 at 1280px)', async ({ page }) => {
    await page.goto('/components');
    await page.waitForLoadState('networkidle');

    const grid = page.locator('.component-grid');
    await expect(grid).toBeVisible();

    // Helper to count computed grid columns
    const getGridColumnCount = async () => {
      return page.evaluate(() => {
        const el = document.querySelector('.component-grid');
        if (!el) return 0;
        const style = window.getComputedStyle(el);
        const cols = style.getPropertyValue('grid-template-columns');
        return cols.split(' ').filter(Boolean).length;
      });
    };

    // 1. Mobile (375px < 640px) -> single column
    await page.setViewportSize({ width: 375, height: 667 });
    expect(await getGridColumnCount()).toBe(1);

    // 2. Tablet (768px: between 640px and 1023px) -> two columns
    await page.setViewportSize({ width: 768, height: 1024 });
    expect(await getGridColumnCount()).toBe(2);

    // 3. Desktop (1280px >= 1024px) -> three columns
    await page.setViewportSize({ width: 1280, height: 800 });
    expect(await getGridColumnCount()).toBe(3);
  });

  test('Navbar has active route indicator and collapses to mobile menu below 768px', async ({ page }) => {
    // Desktop test (1280px)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify Home link has aria-current="page" and solid border-bottom
    const homeLink = page.locator('nav[aria-label="Main Navigation"] a:has-text("Home")');
    await expect(homeLink).toHaveAttribute('aria-current', 'page');
    const homeBorderBottom = await homeLink.evaluate((el) => window.getComputedStyle(el).borderBottomStyle);
    expect(homeBorderBottom).toBe('solid');

    // Navigate to /components and verify Components link is active
    await page.goto('/components');
    await page.waitForLoadState('networkidle');
    const compLink = page.locator('nav[aria-label="Main Navigation"] a:has-text("Components")');
    await expect(compLink).toHaveAttribute('aria-current', 'page');
    const compBorderBottom = await compLink.evaluate((el) => window.getComputedStyle(el).borderBottomStyle);
    expect(compBorderBottom).toBe('solid');

    // Verify responsive collapse below 768px (e.g. 767px)
    await page.setViewportSize({ width: 767, height: 800 });
    await expect(page.locator('#mobile-menu-toggle')).toBeVisible();

    // Verify at 768px desktop nav is shown without overflow
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('#mobile-menu-toggle')).not.toBeVisible();
    await expect(page.locator('nav[aria-label="Main Navigation"]')).toBeVisible();
  });
});

